using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using CommunityServicesPortal.Api.Infrastructure;
using Dapper;
using Microsoft.AspNetCore.Identity;
using CommunityServicesPortal.Api.Domain;
using Microsoft.Extensions.DependencyInjection;
using NUnit.Framework;

namespace CommunityServicesPortal.Tests;

[TestFixture]
[NonParallelizable]
public class ApiTests
{
    private PortalFactory factory = null!;
    [OneTimeSetUp] public void Start() => factory = new PortalFactory();
    [SetUp] public void Reset() => factory.Reset();
    [OneTimeTearDown] public void Stop() => factory.Dispose();

    private static async Task<HttpResponseMessage> Write(HttpClient client, HttpMethod method, string url, object data)
    {
        using var token = JsonDocument.Parse(await client.GetStringAsync("/api/auth/csrf"));
        using var request = new HttpRequestMessage(method, url) { Content = JsonContent.Create(data) };
        request.Headers.Add("X-CSRF-TOKEN", token.RootElement.GetProperty("token").GetString());
        return await client.SendAsync(request);
    }

    private async Task<HttpClient> Login(string email = "citizen1@example.test")
    {
        var client = factory.NewClient();
        using var response = await Write(client, HttpMethod.Post, "/api/auth/login", new { email, password = "Demo123!" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK), await response.Content.ReadAsStringAsync());
        return client;
    }

    [Test]
    public async Task Login_sets_http_only_cookie_and_logout_ends_session()
    {
        using var client = factory.NewClient();
        using var response = await Write(client, HttpMethod.Post, "/api/auth/login", new { email = "CITIZEN1@example.test", password = "Demo123!" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That(string.Join(";", response.Headers.GetValues("Set-Cookie")), Does.Contain("httponly").IgnoreCase);
        var me = await client.GetFromJsonAsync<JsonElement>("/api/auth/me");
        Assert.That(me.GetProperty("role").GetString(), Is.EqualTo("Citizen"));
        using var logout = await Write(client, HttpMethod.Post, "/api/auth/logout", new { });
        Assert.That(logout.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        Assert.That((await client.GetAsync("/api/auth/me")).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Bad_credentials_are_rejected()
    {
        using var client = factory.NewClient();
        using var response = await Write(client, HttpMethod.Post, "/api/auth/login", new { email = "citizen1@example.test", password = "feil" });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Citizen_reads_only_own_private_details_and_messages()
    {
        using var kari = await Login();
        using var ahmed = await Login("citizen2@example.test");
        Assert.That((await kari.GetAsync("/api/cases/1001")).StatusCode, Is.EqualTo(HttpStatusCode.OK));
        Assert.That((await ahmed.GetAsync("/api/cases/1003")).StatusCode, Is.EqualTo(HttpStatusCode.OK));
        foreach (var id in new[] { 1003, 1004, 9999 })
        {
            Assert.That((await kari.GetAsync($"/api/cases/{id}")).StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
            using var message = await Write(kari, HttpMethod.Post, $"/api/cases/{id}/messages", new { text = "Ulovlig" });
            Assert.That(message.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        }
        var mine = await kari.GetFromJsonAsync<JsonElement>("/api/cases/my");
        Assert.That(mine.EnumerateArray().Select(item => item.GetProperty("id").GetInt32()), Is.EquivalentTo(new[] { 1001, 1002 }));
    }

    [Test]
    public async Task Role_policies_guard_every_worker_mutation()
    {
        using var citizen = await Login();
        Assert.That((await citizen.GetAsync("/api/caseworker/cases")).StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        Assert.That((await citizen.GetAsync("/api/caseworker/cases/1003")).StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        foreach (var path in new[] { "assignment", "status" })
        {
            using var response = await Write(citizen, HttpMethod.Put, "/api/caseworker/cases/1001/" + path, new { status = "Resolved", caseWorkerId = 3 });
            Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        }
        using var message = await Write(citizen, HttpMethod.Post, "/api/caseworker/cases/1001/messages", new { text = "Test" });
        Assert.That(message.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        using var worker = await Login("worker1@example.test");
        Assert.That((await worker.GetAsync("/api/cases/my")).StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        using var support = await Write(worker, HttpMethod.Post, "/api/public/cases/1001/support", new { });
        Assert.That(support.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
    }

    [Test]
    public async Task Unauthenticated_requests_cannot_read_or_write_private_data()
    {
        using var client = factory.NewClient();
        foreach (var path in new[] { "/api/cases/my", "/api/cases/1001", "/api/caseworker/cases" })
            Assert.That((await client.GetAsync(path)).StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
        using var response = await Write(client, HttpMethod.Post, "/api/public/cases/1001/support", new { });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }

    [Test]
    public async Task Public_DTO_is_an_explicit_allowlist_and_private_case_is_absent()
    {
        using var client = factory.NewClient();
        var list = await client.GetFromJsonAsync<JsonElement>("/api/public/cases");
        Assert.That(list.EnumerateArray().Select(item => item.GetProperty("id").GetInt32()), Is.EquivalentTo(new[] { 1001, 1002, 1004 }));
        Assert.That((await client.GetAsync("/api/public/cases/1003")).StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        var anonymous = await client.GetFromJsonAsync<JsonElement>("/api/public/cases/1001");
        Assert.That(anonymous.EnumerateObject().Select(property => property.Name), Is.EquivalentTo(new[]
        { "id", "type", "title", "description", "location", "status", "createdAt", "updatedAt", "citizenName", "supportCount", "supportedByMe", "canSupport" }));
        Assert.That(anonymous.GetProperty("citizenName").ValueKind, Is.EqualTo(JsonValueKind.Null));
        Assert.That(anonymous.ToString(), Does.Not.Contain("Kari").And.Not.Contain("@example").And.Not.Contain("rydding"));
        var named = await client.GetFromJsonAsync<JsonElement>("/api/public/cases/1002");
        Assert.That(named.GetProperty("citizenName").GetString(), Is.EqualTo("Kari Nordmann"));
    }

    [Test]
    public async Task Support_is_unique_also_for_concurrent_requests()
    {
        using var client = await Login();
        using var token = JsonDocument.Parse(await client.GetStringAsync("/api/auth/csrf"));
        var requests = Enumerable.Range(0, 2).Select(_ =>
        {
            var request = new HttpRequestMessage(HttpMethod.Post, "/api/public/cases/1004/support") { Content = JsonContent.Create(new { }) };
            request.Headers.Add("X-CSRF-TOKEN", token.RootElement.GetProperty("token").GetString());
            return client.SendAsync(request);
        });
        var responses = await Task.WhenAll(requests);
        Assert.That(responses.Select(response => response.StatusCode), Is.EquivalentTo(new[] { HttpStatusCode.NoContent, HttpStatusCode.Conflict }));
        foreach (var response in responses) response.Dispose();
        var item = await client.GetFromJsonAsync<JsonElement>("/api/public/cases/1004");
        Assert.That(item.GetProperty("supportCount").GetInt32(), Is.EqualTo(1));
        using var privateSupport = await Write(client, HttpMethod.Post, "/api/public/cases/1003/support", new { });
        Assert.That(privateSupport.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        using var suggestionSupport = await Write(client, HttpMethod.Post, "/api/public/cases/1002/support", new { });
        Assert.That(suggestionSupport.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [TestCase("citizen1@example.test", 1001)]
    [TestCase("citizen2@example.test", 1004)]
    public async Task Citizen_cannot_support_own_public_case(string email, int caseId)
    {
        using var client = await Login(email);
        var before = await client.GetFromJsonAsync<JsonElement>($"/api/public/cases/{caseId}");
        Assert.That(before.GetProperty("canSupport").GetBoolean(), Is.False);
        using var response = await Write(client, HttpMethod.Post, $"/api/public/cases/{caseId}/support", new { });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        var error = await response.Content.ReadFromJsonAsync<JsonElement>();
        Assert.That(error.GetProperty("message").GetString(), Is.EqualTo("Du kan ikke registrere støtte på din egen sak."));
        var after = await client.GetFromJsonAsync<JsonElement>($"/api/public/cases/{caseId}");
        Assert.That(after.GetProperty("supportCount").GetInt32(), Is.EqualTo(before.GetProperty("supportCount").GetInt32()));
    }

    [TestCase("Problem", "PublicAnonymous")]
    [TestCase("MaintenanceObservation", "NotPublished")]
    [TestCase("ImprovementSuggestion", "PublicWithName")]
    public async Task Creates_each_type_with_correct_ownership_publication_and_history(string type, string publicationSetting)
    {
        using var client = await Login();
        using var response = await Write(client, HttpMethod.Post, "/api/cases", new
        {
            type, title = " Ny sak ", description = "Beskrivelse", location = "Parken", publicationSetting,
            impactLevel = "Medium", isSafetyRisk = false, observedChange = "En skade", mayGetWorse = false,
            proposedImprovement = "En benk", expectedBenefit = "Et sted å hvile", citizenId = 2, status = "Closed"
        });
        Assert.That(response.StatusCode, Is.EqualTo(HttpStatusCode.Created), await response.Content.ReadAsStringAsync());
        var created = await response.Content.ReadFromJsonAsync<JsonElement>();
        var id = created.GetProperty("id").GetInt32();
        var details = await client.GetFromJsonAsync<JsonElement>($"/api/cases/{id}");
        var item = details.GetProperty("case");
        Assert.Multiple(() =>
        {
            Assert.That(item.GetProperty("citizenId").GetInt32(), Is.EqualTo(1));
            Assert.That(item.GetProperty("status").GetString(), Is.EqualTo("Submitted"));
            Assert.That(item.GetProperty("title").GetString(), Is.EqualTo("Ny sak"));
            Assert.That(details.GetProperty("statusHistory").GetArrayLength(), Is.EqualTo(1));
        });
        Assert.That((await client.GetAsync($"/api/public/cases/{id}")).StatusCode,
            Is.EqualTo(publicationSetting == "NotPublished" ? HttpStatusCode.NotFound : HttpStatusCode.OK));
    }

    [Test]
    public async Task Invalid_input_and_missing_csrf_are_rejected()
    {
        using var client = await Login();
        using var missingCsrf = await client.PostAsJsonAsync("/api/cases", new { });
        Assert.That(missingCsrf.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        using var missingFields = await Write(client, HttpMethod.Post, "/api/cases", new { type = "Problem", title = "Test", description = "Test", location = "Test" });
        Assert.That(missingFields.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        using var invalidEnum = await Write(client, HttpMethod.Post, "/api/cases", new { type = "Unknown" });
        Assert.That(invalidEnum.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        using var numericEnum = await Write(client, HttpMethod.Post, "/api/cases", new { type = 0 });
        Assert.That(numericEnum.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        using var missingType = await Write(client, HttpMethod.Post, "/api/cases", new { title = "Test", description = "Test", location = "Test", impactLevel = "Low", isSafetyRisk = false });
        Assert.That(missingType.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        using var blankMessage = await Write(client, HttpMethod.Post, "/api/cases/1001/messages", new { text = "  " });
        Assert.That(blankMessage.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Public_filters_return_only_matching_published_cases()
    {
        using var client = factory.NewClient();
        var list = await client.GetFromJsonAsync<JsonElement>("/api/public/cases?type=MaintenanceObservation&status=InProgress");
        Assert.That(list.EnumerateArray().Select(item => item.GetProperty("id").GetInt32()), Is.EqualTo(new[] { 1004 }));
        Assert.That((await client.GetAsync("/api/public/cases?status=999")).StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
    }

    [Test]
    public async Task Concurrent_status_changes_create_exactly_one_history_entry()
    {
        using var worker = await Login("worker1@example.test");
        using var token = JsonDocument.Parse(await worker.GetStringAsync("/api/auth/csrf"));
        var requests = new[] { "WaitingForCitizen", "Resolved" }.Select(status =>
        {
            var request = new HttpRequestMessage(HttpMethod.Put, "/api/caseworker/cases/1001/status") { Content = JsonContent.Create(new { status }) };
            request.Headers.Add("X-CSRF-TOKEN", token.RootElement.GetProperty("token").GetString());
            return worker.SendAsync(request);
        });
        var responses = await Task.WhenAll(requests);
        Assert.That(responses.Select(response => response.StatusCode), Is.EquivalentTo(new[] { HttpStatusCode.NoContent, HttpStatusCode.Conflict }));
        foreach (var response in responses) response.Dispose();
        var details = await worker.GetFromJsonAsync<JsonElement>("/api/caseworker/cases/1001");
        Assert.That(details.GetProperty("statusHistory").GetArrayLength(), Is.EqualTo(3));
    }

    [Test]
    public async Task Worker_and_citizen_complete_a_case_with_messages_and_history()
    {
        using var worker = await Login("worker1@example.test");
        using var citizen = await Login("citizen1@example.test");
        using var badAssignment = await Write(worker, HttpMethod.Put, "/api/caseworker/cases/1002/assignment", new { caseWorkerId = 1 });
        Assert.That(badAssignment.StatusCode, Is.EqualTo(HttpStatusCode.BadRequest));
        using var assignment = await Write(worker, HttpMethod.Put, "/api/caseworker/cases/1002/assignment", new { caseWorkerId = 4 });
        Assert.That(assignment.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        using var invalid = await Write(worker, HttpMethod.Put, "/api/caseworker/cases/1002/status", new { status = "Closed" });
        Assert.That(invalid.StatusCode, Is.EqualTo(HttpStatusCode.Conflict));
        foreach (var status in new[] { "InProgress", "WaitingForCitizen", "InProgress", "Resolved", "Closed" })
        {
            if (status == "WaitingForCitizen")
            {
                using var question = await Write(worker, HttpMethod.Post, "/api/caseworker/cases/1002/messages", new { text = "Hvor skal stativene stå?" });
                Assert.That(question.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            }
            using var changed = await Write(worker, HttpMethod.Put, "/api/caseworker/cases/1002/status", new { status });
            Assert.That(changed.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            if (status == "WaitingForCitizen")
            {
                using var answer = await Write(citizen, HttpMethod.Post, "/api/cases/1002/messages", new { text = "Ved skiltet." });
                Assert.That(answer.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
            }
        }
        var details = await worker.GetFromJsonAsync<JsonElement>("/api/caseworker/cases/1002");
        Assert.That(details.GetProperty("case").GetProperty("status").GetString(), Is.EqualTo("Closed"));
        Assert.That(details.GetProperty("case").GetProperty("assignedCaseWorkerId").GetInt32(), Is.EqualTo(4));
        Assert.That(details.GetProperty("statusHistory").GetArrayLength(), Is.EqualTo(6));
        Assert.That(details.GetProperty("messages").GetArrayLength(), Is.EqualTo(2));
    }

    [Test]
    public async Task Seed_passwords_are_hashed_and_reset_restores_fixed_cases()
    {
        using (var connection = factory.Services.GetRequiredService<Database>().Open())
        {
            var users = connection.Query<User>("SELECT * FROM Users").ToList();
            Assert.That(users, Has.Count.EqualTo(4));
            foreach (var user in users)
            {
                Assert.That(user.PasswordHash, Is.Not.EqualTo("Demo123!"));
                Assert.That(new PasswordHasher<User>().VerifyHashedPassword(user, user.PasswordHash, "Demo123!"), Is.Not.EqualTo(PasswordVerificationResult.Failed));
            }
        }
        using var citizen = await Login();
        using var denied = await Write(citizen, HttpMethod.Post, "/api/test/reset", new { });
        Assert.That(denied.StatusCode, Is.EqualTo(HttpStatusCode.Forbidden));
        using var worker = await Login("worker2@example.test");
        using var changed = await Write(worker, HttpMethod.Put, "/api/caseworker/cases/1001/status", new { status = "Resolved" });
        Assert.That(changed.StatusCode, Is.EqualTo(HttpStatusCode.NoContent));
        using var reset = await Write(worker, HttpMethod.Post, "/api/test/reset", new { });
        Assert.That(reset.StatusCode, Is.EqualTo(HttpStatusCode.OK));
        var restored = await worker.GetFromJsonAsync<JsonElement>("/api/caseworker/cases/1001");
        Assert.That(restored.GetProperty("case").GetProperty("status").GetString(), Is.EqualTo("InProgress"));
        Assert.That((await worker.GetFromJsonAsync<JsonElement>("/api/caseworker/cases")).GetArrayLength(), Is.EqualTo(4));
    }

    [Test]
    public async Task Production_has_no_reset_route_or_demo_accounts()
    {
        using var production = new PortalFactory("Production");
        using var client = production.NewClient();
        using var reset = await Write(client, HttpMethod.Post, "/api/test/reset", new { });
        Assert.That(reset.StatusCode, Is.EqualTo(HttpStatusCode.NotFound));
        using var login = await Write(client, HttpMethod.Post, "/api/auth/login", new { email = "worker1@example.test", password = "Demo123!" });
        Assert.That(login.StatusCode, Is.EqualTo(HttpStatusCode.Unauthorized));
    }
}
