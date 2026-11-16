using System.Security.Claims;
using CommunityServicesPortal.Api.Domain;

namespace CommunityServicesPortal.Api.Authentication;

public static class CurrentUser
{
    public static int Id(ClaimsPrincipal user) => int.Parse(user.FindFirstValue(ClaimTypes.NameIdentifier)!);
    public static int? OptionalCitizenId(ClaimsPrincipal user) => user.IsInRole(nameof(UserRole.Citizen)) ? Id(user) : null;
    public const string CitizenPolicy = "CitizenOnly";
    public const string WorkerPolicy = "CaseWorkerOnly";
}
