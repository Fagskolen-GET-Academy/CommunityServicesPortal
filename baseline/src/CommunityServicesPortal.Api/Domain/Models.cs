namespace CommunityServicesPortal.Api.Domain;

public enum UserRole { Citizen, CaseWorker }
public enum CaseType { Problem, MaintenanceObservation, ImprovementSuggestion }
public enum ImpactLevel { Low, Medium, High }
public enum PublicationSetting { PublicAnonymous, PublicWithName, NotPublished }
public enum CaseStatus { Submitted, InProgress, WaitingForCitizen, Resolved, Closed }

public sealed class User
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public UserRole Role { get; set; }
}

public sealed class CitizenCase
{
    public int Id { get; set; }
    public CaseType Type { get; set; }
    public int CitizenId { get; set; }
    public int? AssignedCaseWorkerId { get; set; }
    public string Title { get; set; } = "";
    public string Description { get; set; } = "";
    public string Location { get; set; } = "";
    public CaseStatus Status { get; set; }
    public PublicationSetting PublicationSetting { get; set; }
    // UTC ISO 8601 strings keep SQLite storage and the API easy to inspect.
    public string CreatedAt { get; set; } = "";
    public string UpdatedAt { get; set; } = "";
    public ImpactLevel? ImpactLevel { get; set; }
    public bool? IsSafetyRisk { get; set; }
    public string? ObservedChange { get; set; }
    public bool? MayGetWorse { get; set; }
    public string? ProposedImprovement { get; set; }
    public string? ExpectedBenefit { get; set; }
}

public sealed record CaseMessage(int Id, int CaseId, int AuthorUserId, string AuthorName,
    string AuthorRole, string Text, string CreatedAt)
{
    public CaseMessage() : this(0, 0, 0, "", "", "", "") { }
}
public sealed record CaseStatusHistory(int Id, int CaseId, string? FromStatus, string ToStatus,
    int ChangedByUserId, string ChangedAt)
{
    public CaseStatusHistory() : this(0, 0, null, "", 0, "") { }
}
public sealed record CaseSupport(int CaseId, int CitizenId, string CreatedAt);
