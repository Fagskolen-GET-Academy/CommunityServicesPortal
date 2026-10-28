using CommunityServicesPortal.Api.Domain;
using System.Text.Json.Serialization;

namespace CommunityServicesPortal.Api.Application;

public sealed record LoginRequest(string? Email, string? Password);
public sealed record UserDto(int Id, string Name, string Email, UserRole Role);
public sealed record WorkerDto(int Id, string Name)
{
    public WorkerDto() : this(0, "") { }
}
public sealed record CreateCaseRequest([property: JsonRequired] CaseType Type, string? Title, string? Description,
    string? Location, PublicationSetting PublicationSetting = PublicationSetting.PublicAnonymous,
    ImpactLevel? ImpactLevel = null, bool? IsSafetyRisk = null, string? ObservedChange = null,
    bool? MayGetWorse = null, string? ProposedImprovement = null, string? ExpectedBenefit = null);
public sealed record MessageRequest(string? Text);
public sealed record AssignmentRequest(int? CaseWorkerId);
public sealed record StatusRequest(CaseStatus Status);
public sealed record CaseDetails(CitizenCase Case, string CitizenName, string? AssignedCaseWorkerName,
    IReadOnlyList<CaseMessage> Messages, IReadOnlyList<CaseStatusHistory> StatusHistory);

// Public responses use an explicit allowlist. Never serialize CitizenCase on a public route.
public sealed record PublicCaseDto(int Id, CaseType Type, string Title, string Description,
    string Location, CaseStatus Status, string CreatedAt, string UpdatedAt, string? CitizenName,
    int SupportCount, bool SupportedByMe, bool CanSupport)
{
    public PublicCaseDto() : this(0, default, "", "", "", default, "", "", null, 0, false, false) { }
}

public sealed class RuleException(int statusCode, string message) : Exception(message)
{
    public int StatusCode { get; } = statusCode;
}
