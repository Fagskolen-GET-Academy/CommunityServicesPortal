using System.Security.Claims;
using CommunityServicesPortal.Api.Application;
using CommunityServicesPortal.Api.Authentication;
using CommunityServicesPortal.Api.Domain;
using CommunityServicesPortal.Api.Infrastructure;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace CommunityServicesPortal.Api.Endpoints;

public static class PortalEndpoints
{
    public static void MapPortalEndpoints(this WebApplication app)
    {
        var auth = app.MapGroup("/api/auth");
        auth.MapGet("/csrf", (HttpContext context, IAntiforgery antiforgery) =>
            Results.Ok(new { token = antiforgery.GetAndStoreTokens(context).RequestToken }));
        auth.MapPost("/login", async (LoginRequest request, AuthService service, HttpContext context) =>
        {
            var user = service.Login(request);
            Claim[] claims = [new(ClaimTypes.NameIdentifier, user.Id.ToString()), new(ClaimTypes.Name, user.Name),
                new(ClaimTypes.Email, user.Email), new(ClaimTypes.Role, user.Role.ToString())];
            await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme)));
            return Results.Ok(user);
        }).RequireRateLimiting("login");
        auth.MapPost("/logout", async (HttpContext context) =>
        {
            await context.SignOutAsync();
            return Results.NoContent();
        }).RequireAuthorization();
        auth.MapGet("/me", (ClaimsPrincipal principal, UserRepository users) =>
        {
            var user = users.Find(CurrentUser.Id(principal))!;
            return Results.Ok(new UserDto(user.Id, user.Name, user.Email, user.Role));
        }).RequireAuthorization();

        var publicApi = app.MapGroup("/api/public/cases");
        publicApi.MapGet("/", (CaseType? type, CaseStatus? status, ClaimsPrincipal user, PublicCaseService service) =>
            Results.Ok(service.List(CurrentUser.OptionalCitizenId(user), Valid(type), Valid(status))));
        publicApi.MapGet("/{id:int}", (int id, ClaimsPrincipal user, PublicCaseService service) =>
            Results.Ok(service.DetailsWithContact(id, CurrentUser.OptionalCitizenId(user))));
        publicApi.MapPost("/{id:int}/support", (int id, ClaimsPrincipal user, PublicCaseService service) =>
        {
            service.Support(id, CurrentUser.Id(user));
            return Results.NoContent();
        }).RequireAuthorization(CurrentUser.CitizenPolicy);

        var citizen = app.MapGroup("/api/cases").RequireAuthorization(CurrentUser.CitizenPolicy);
        citizen.MapPost("/", (CreateCaseRequest request, ClaimsPrincipal user, CaseService service) =>
        {
            var id = service.Create(request, CurrentUser.Id(user));
            return Results.Created($"/api/cases/{id}", new { id });
        });
        citizen.MapGet("/my", (ClaimsPrincipal user, CaseService service) => Results.Ok(service.MyCases(CurrentUser.Id(user))));
        citizen.MapGet("/{id:int}", (int id, ClaimsPrincipal user, CaseService service) => Results.Ok(service.CitizenDetails(id, CurrentUser.Id(user))));
        citizen.MapPost("/{id:int}/messages", (int id, MessageRequest request, ClaimsPrincipal user, CaseService service) =>
        {
            service.CitizenMessage(id, CurrentUser.Id(user), request.Text);
            return Results.NoContent();
        });

        var worker = app.MapGroup("/api/caseworker").RequireAuthorization(CurrentUser.WorkerPolicy);
        worker.MapGet("/workers", (CaseService service) => Results.Ok(service.Workers()));
        worker.MapGet("/cases", (CaseStatus? status, int? assignedTo, CaseService service) => Results.Ok(service.WorkerCases(Valid(status), assignedTo)));
        worker.MapGet("/cases/{id:int}", (int id, CaseService service) => Results.Ok(service.WorkerDetails(id)));
        worker.MapPut("/cases/{id:int}/assignment", (int id, AssignmentRequest request, CaseService service) =>
        {
            service.Assign(id, request.CaseWorkerId);
            return Results.NoContent();
        });
        app.MapPut("/api/caseworker/cases/{id:int}/status", (int id, StatusRequest request, ClaimsPrincipal user, CaseService service) =>
        {
            service.ChangeStatus(id, request.Status, CurrentUser.Id(user));
            return Results.NoContent();
        }).RequireAuthorization();
        worker.MapPost("/cases/{id:int}/messages", (int id, MessageRequest request, ClaimsPrincipal user, CaseService service) =>
        {
            service.WorkerMessage(id, CurrentUser.Id(user), request.Text);
            return Results.NoContent();
        });

        if (app.Environment.IsDevelopment() || app.Environment.IsEnvironment("Testing"))
            app.MapPost("/api/test/reset", (Database database) =>
            {
                database.Reset();
                return Results.Ok(new { message = "Databasen er nullstilt til undervisningstilstand." });
            }).RequireAuthorization(CurrentUser.WorkerPolicy);
    }

    private static T? Valid<T>(T? value) where T : struct, Enum => value is null || Enum.IsDefined(value.Value)
        ? value : throw new RuleException(400, "Ugyldig filterverdi.");
}
