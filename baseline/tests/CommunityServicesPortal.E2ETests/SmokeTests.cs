using System.Diagnostics;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using Microsoft.Playwright;
using NUnit.Framework;
using static Microsoft.Playwright.Assertions;

namespace CommunityServicesPortal.E2ETests;

[TestFixture]
[NonParallelizable]
public class SmokeTests
{
    private IPlaywright playwright = null!;
    private IBrowser browser = null!;
    private IBrowserContext context = null!;
    private IPage page = null!;
    private Process? server;
    private string baseUrl = "";
    private readonly string testDirectory = Path.Combine(Path.GetTempPath(), "CommunityPortalE2E", Guid.NewGuid().ToString("N"));
    private readonly StringBuilder serverLog = new();

    [OneTimeSetUp]
    public async Task StartServerAndBrowser()
    {
        var root = new DirectoryInfo(AppContext.BaseDirectory);
        while (root is not null && !File.Exists(Path.Combine(root.FullName, "CommunityServicesPortal.sln"))) root = root.Parent;
        if (root is null) throw new InvalidOperationException("Fant ikke prosjektroten.");
        var configuration = new DirectoryInfo(AppContext.BaseDirectory).Parent!.Name;
        var apiDirectory = Path.Combine(root.FullName, "src", "CommunityServicesPortal.Api");
        using var listener = new TcpListener(IPAddress.Loopback, 0);
        listener.Start();
        var port = ((IPEndPoint)listener.LocalEndpoint).Port;
        listener.Stop();
        baseUrl = $"http://127.0.0.1:{port}";
        var start = new ProcessStartInfo("dotnet")
        {
            WorkingDirectory = apiDirectory, RedirectStandardOutput = true, RedirectStandardError = true,
            UseShellExecute = false, CreateNoWindow = true
        };
        start.ArgumentList.Add(Path.Combine(apiDirectory, "bin", configuration, "net8.0", "CommunityServicesPortal.Api.dll"));
        start.Environment["ASPNETCORE_URLS"] = baseUrl;
        start.Environment["ASPNETCORE_ENVIRONMENT"] = "Testing";
        start.Environment["Database__Path"] = Path.Combine(testDirectory, "e2e.db");
        start.Environment["DataProtection__Path"] = Path.Combine(testDirectory, "keys");
        server = Process.Start(start)!;
        server.OutputDataReceived += (_, args) => { lock (serverLog) serverLog.AppendLine(args.Data); };
        server.ErrorDataReceived += (_, args) => { lock (serverLog) serverLog.AppendLine(args.Data); };
        server.BeginOutputReadLine();
        server.BeginErrorReadLine();
        using var client = new HttpClient { Timeout = TimeSpan.FromSeconds(2) };
        var ready = false;
        for (var attempt = 0; attempt < 100; attempt++)
        {
            if (server.HasExited) throw new InvalidOperationException(serverLog.ToString());
            try { ready = (await client.GetAsync(baseUrl + "/api/public/cases")).IsSuccessStatusCode; }
            catch (HttpRequestException) { }
            catch (TaskCanceledException) { }
            if (ready) break;
            await Task.Delay(200);
        }
        if (!ready) throw new InvalidOperationException("Testserver startet ikke. " + serverLog);
        playwright = await Playwright.CreateAsync();
        browser = await playwright.Chromium.LaunchAsync(new() { Headless = true, Channel = Environment.GetEnvironmentVariable("PLAYWRIGHT_CHANNEL") });
    }

    [SetUp]
    public async Task ResetAndOpenPage()
    {
        // Reset through the same protected API as teaching tools, in a separate worker session.
        var api = await playwright.APIRequest.NewContextAsync(new() { BaseURL = baseUrl });
        await ApiWrite(api, "/api/auth/login", new { email = "worker1@example.test", password = "Demo123!" });
        await ApiWrite(api, "/api/test/reset", new { });
        await api.DisposeAsync();
        context = await browser.NewContextAsync(new() { BaseURL = baseUrl, ViewportSize = new() { Width = 1280, Height = 900 } });
        page = await context.NewPageAsync();
        page.PageError += (_, error) => TestContext.Progress.WriteLine("Browser error: " + error);
        page.Console += (_, message) => { if (message.Type == "error") TestContext.Progress.WriteLine("Browser console: " + message.Text); };
        await page.GotoAsync("/");
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Sammen om nærmiljøet" })).ToBeVisibleAsync();
    }

    private static async Task ApiWrite(IAPIRequestContext api, string url, object data)
    {
        var tokenResponse = await api.GetAsync("/api/auth/csrf");
        var token = (await tokenResponse.JsonAsync())!.Value.GetProperty("token").GetString()!;
        var response = await api.PostAsync(url, new() { DataObject = data, Headers = new Dictionary<string, string> { ["X-CSRF-TOKEN"] = token } });
        Assert.That(response.Ok, Is.True, await response.TextAsync());
    }

    private async Task LoginAs(string email, string expectedHeading)
    {
        await page.GetByRole(AriaRole.Link, new() { Name = "Logg inn", Exact = true }).ClickAsync();
        await page.GetByLabel("E-post", new() { Exact = true }).FillAsync(email);
        await page.GetByLabel("Passord", new() { Exact = true }).FillAsync("Demo123!");
        await page.GetByRole(AriaRole.Button, new() { Name = "Logg inn", Exact = true }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = expectedHeading, Exact = true })).ToBeVisibleAsync();
    }

    [TestCase("Problem")]
    [TestCase("MaintenanceObservation")]
    [TestCase("ImprovementSuggestion")]
    public async Task Citizen_creates_case_and_finds_it_in_my_cases(string type)
    {
        await LoginAs("citizen1@example.test", "Mine saker");
        await page.GetByRole(AriaRole.Link, new() { Name = "Meld inn sak", Exact = true }).First.ClickAsync();
        await page.GetByLabel("Hva vil du melde inn?").SelectOptionAsync(type);
        await page.GetByLabel("Kort tittel").FillAsync("Ny sak fra ende-til-ende-test");
        await page.GetByLabel("Beskrivelse", new() { Exact = true }).FillAsync("En konkret beskrivelse av behovet.");
        await page.GetByLabel("Sted", new() { Exact = true }).FillAsync("Sørparken ved inngangen");
        if (type == "Problem")
        {
            await page.GetByLabel("Hvor mye påvirker problemet bruk av området?").SelectOptionAsync("Medium");
            await page.GetByLabel("Er problemet en sikkerhetsrisiko?").SelectOptionAsync("false");
        }
        else if (type == "MaintenanceObservation")
        {
            await page.GetByLabel("Hva har du observert?").FillAsync("En løs planke.");
            await page.GetByLabel("Kan tilstanden bli verre?").SelectOptionAsync("true");
        }
        else
        {
            await page.GetByLabel("Foreslått forbedring", new() { Exact = true }).FillAsync("En ny benk.");
            await page.GetByLabel("Forventet nytte").FillAsync("Et sted å hvile.");
        }
        await page.GetByRole(AriaRole.Button, new() { Name = "Send inn sak" }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("er sendt inn");
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Ny sak fra ende-til-ende-test", Exact = true })).ToBeVisibleAsync();
        await page.GetByRole(AriaRole.Link, new() { Name = "Mine saker", Exact = true }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Link, new() { Name = "Ny sak fra ende-til-ende-test" })).ToBeVisibleAsync();
    }

    [Test]
    public async Task Citizen_reads_seeded_case_and_sends_reply()
    {
        await LoginAs("citizen2@example.test", "Mine saker");
        await page.GetByRole(AriaRole.Link, new() { Name = "Knust vindu i kommunalt bygg" }).ClickAsync();
        await Expect(page.GetByText("Kan du beskrive hvilken side av bygget vinduet er på?", new() { Exact = true })).ToBeVisibleAsync();
        await page.GetByLabel("Ny melding").FillAsync("Vinduet vender mot parken.");
        await page.GetByRole(AriaRole.Button, new() { Name = "Send melding" }).ClickAsync();
        await Expect(page.GetByText("Vinduet vender mot parken.", new() { Exact = true })).ToBeVisibleAsync();
    }

    [Test]
    public async Task Worker_assigns_changes_status_and_sends_message()
    {
        await LoginAs("worker1@example.test", "Saksoversikt");
        var assignmentFilter = page.GetByLabel("Tildelt saksbehandler", new() { Exact = true });
        await Expect(assignmentFilter.Locator("option[value='']")).ToHaveTextAsync("Alle saksbehandlere");
        await assignmentFilter.SelectOptionAsync("3");
        await page.GetByRole(AriaRole.Button, new() { Name = "Vis saker", Exact = true }).ClickAsync();
        await Expect(page.Locator(".result-count")).ToHaveTextAsync("2 saker");
        await Expect(page.GetByRole(AriaRole.Link, new() { Name = "Sykkelparkering ved holdeplassen" })).ToHaveCountAsync(0);
        await assignmentFilter.SelectOptionAsync("");
        await page.GetByRole(AriaRole.Button, new() { Name = "Vis saker", Exact = true }).ClickAsync();
        await Expect(page.Locator(".result-count")).ToHaveTextAsync("4 saker");
        await page.GetByRole(AriaRole.Link, new() { Name = "Sykkelparkering ved holdeplassen" }).ClickAsync();
        await page.GetByLabel("Saksbehandler", new() { Exact = true }).SelectOptionAsync("3");
        await page.GetByRole(AriaRole.Button, new() { Name = "Lagre tildeling" }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("Tildelingen er lagret");
        await page.GetByLabel("Ny status").SelectOptionAsync("InProgress");
        await page.GetByRole(AriaRole.Button, new() { Name = "Endre status" }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Status)).ToContainTextAsync("Status er oppdatert");
        await page.GetByLabel("Ny melding").FillAsync("Vi vurderer plasseringen.");
        await page.GetByRole(AriaRole.Button, new() { Name = "Send melding" }).ClickAsync();
        await Expect(page.GetByText("Vi vurderer plasseringen.", new() { Exact = true })).ToBeVisibleAsync();
        await page.ReloadAsync();
        await Expect(page.Locator("#page > p .badge")).ToHaveTextAsync("Under behandling");
        await Expect(page.GetByLabel("Saksbehandler", new() { Exact = true })).ToHaveValueAsync("3");
    }

    [Test]
    public async Task Own_case_has_no_support_button_but_other_citizens_case_can_be_supported()
    {
        await LoginAs("citizen1@example.test", "Mine saker");
        await page.GetByRole(AriaRole.Link, new() { Name = "Offentlige saker", Exact = true }).ClickAsync();
        var ownCase = page.GetByRole(AriaRole.Article).Filter(new() { HasText = "Tre over turstien" });
        await Expect(ownCase).ToBeVisibleAsync();
        await Expect(ownCase.GetByRole(AriaRole.Button, new() { Name = "Jeg opplever dette også" })).ToHaveCountAsync(0);
        await Expect(ownCase).ToContainTextAsync("1 opplever dette også");
        var otherCase = page.GetByRole(AriaRole.Article).Filter(new() { HasText = "Erosjon ved bekken" });
        await otherCase.GetByRole(AriaRole.Button, new() { Name = "Jeg opplever dette også" }).ClickAsync();
        await Expect(otherCase).ToContainTextAsync("Registrert av deg");
        await Expect(otherCase).ToContainTextAsync("1 opplever dette også");
        await ownCase.GetByRole(AriaRole.Link, new() { Name = "Tre over turstien" }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Tre over turstien", Exact = true })).ToBeVisibleAsync();
        await Expect(page.GetByRole(AriaRole.Button, new() { Name = "Jeg opplever dette også" })).ToHaveCountAsync(0);
    }

    [Test]
    public async Task Public_overview_shows_published_cases_and_works_on_mobile()
    {
        await Expect(page.GetByRole(AriaRole.Link, new() { Name = "Tre over turstien" })).ToBeVisibleAsync();
        await Expect(page.GetByRole(AriaRole.Link, new() { Name = "Knust vindu i kommunalt bygg" })).ToHaveCountAsync(0);
        var anonymousCard = page.GetByRole(AriaRole.Article).Filter(new() { HasText = "Tre over turstien" });
        await Expect(anonymousCard).Not.ToContainTextAsync("Kari Nordmann");
        var screenshots = Path.Combine(TestContext.CurrentContext.WorkDirectory, "TestResults");
        Directory.CreateDirectory(screenshots);
        await page.ScreenshotAsync(new() { Path = Path.Combine(screenshots, "public-desktop.png"), FullPage = true });
        await page.SetViewportSizeAsync(390, 844);
        Assert.That(await page.EvaluateAsync<bool>("document.documentElement.scrollWidth <= window.innerWidth"), Is.True);
        await page.ScreenshotAsync(new() { Path = Path.Combine(screenshots, "public-mobile.png"), FullPage = true });
        await page.GetByRole(AriaRole.Link, new() { Name = "Tre over turstien" }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Tre over turstien", Exact = true })).ToBeVisibleAsync();
    }

    [Test]
    public async Task Hash_routes_support_refresh_back_forward_and_logout()
    {
        await page.GotoAsync("/#login");
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Logg inn", Exact = true })).ToBeVisibleAsync();
        await page.ReloadAsync();
        await page.GetByLabel("E-post", new() { Exact = true }).FillAsync("citizen1@example.test");
        await page.GetByLabel("Passord", new() { Exact = true }).FillAsync("Demo123!");
        await page.GetByRole(AriaRole.Button, new() { Name = "Logg inn", Exact = true }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Mine saker", Exact = true })).ToBeVisibleAsync();
        await page.GotoAsync("/#my/1001");
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Tre over turstien", Exact = true })).ToBeVisibleAsync();
        await page.ReloadAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Tre over turstien", Exact = true })).ToBeVisibleAsync();
        await page.GetByRole(AriaRole.Link, new() { Name = "Meld inn sak", Exact = true }).ClickAsync();
        await Expect(page.GetByLabel("Kort tittel")).ToBeVisibleAsync();
        await page.GoBackAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Tre over turstien", Exact = true })).ToBeVisibleAsync();
        await page.GoForwardAsync();
        await Expect(page.GetByLabel("Kort tittel")).ToBeVisibleAsync();
        await page.GetByLabel("Kort tittel").FillAsync("Utkast");
        await page.GetByLabel("Hva vil du melde inn?").SelectOptionAsync("MaintenanceObservation");
        await Expect(page.GetByLabel("Hva har du observert?")).ToBeVisibleAsync();
        await page.GetByLabel("Hva vil du melde inn?").SelectOptionAsync("ImprovementSuggestion");
        await Expect(page.GetByLabel("Foreslått forbedring", new() { Exact = true })).ToBeVisibleAsync();
        await page.GetByLabel("Hva vil du melde inn?").SelectOptionAsync("Problem");
        await Expect(page.GetByLabel("Kort tittel")).ToHaveValueAsync("Utkast");
        await page.GetByRole(AriaRole.Button, new() { Name = "Logg ut", Exact = true }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Sammen om nærmiljøet", Exact = true })).ToBeVisibleAsync();
        await LoginAs("worker1@example.test", "Saksoversikt");
        await page.GotoAsync("/#worker/1003");
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Knust vindu i kommunalt bygg", Exact = true })).ToBeVisibleAsync();
        await page.ReloadAsync();
        await Expect(page.GetByLabel("Ny status")).ToBeVisibleAsync();
        await page.GetByRole(AriaRole.Link, new() { Name = "Saksoversikt", Exact = true }).ClickAsync();
        await Expect(page.GetByRole(AriaRole.Heading, new() { Name = "Saksoversikt", Exact = true })).ToBeVisibleAsync();
    }

    [Test]
    public async Task Message_markup_is_displayed_as_text()
    {
        await LoginAs("citizen1@example.test", "Mine saker");
        await page.GetByRole(AriaRole.Link, new() { Name = "Tre over turstien" }).ClickAsync();
        const string text = "<b>Vanlig tekst</b> & en observasjon";
        await page.GetByLabel("Ny melding").FillAsync(text);
        await page.GetByRole(AriaRole.Button, new() { Name = "Send melding" }).ClickAsync();
        await Expect(page.GetByText(text, new() { Exact = true })).ToBeVisibleAsync();
        await Expect(page.Locator(".message b")).ToHaveCountAsync(0);
        await page.ReloadAsync();
        await Expect(page.GetByText(text, new() { Exact = true })).ToBeVisibleAsync();
    }

    [TearDown]
    public async Task CloseContext() { if (context is not null) await context.DisposeAsync(); }

    [OneTimeTearDown]
    public async Task StopServerAndBrowser()
    {
        if (browser is not null) await browser.DisposeAsync();
        playwright?.Dispose();
        if (server is { HasExited: false }) { server.Kill(entireProcessTree: true); await server.WaitForExitAsync(); }
        server?.Dispose();
        if (Directory.Exists(testDirectory)) Directory.Delete(testDirectory, true);
    }
}
