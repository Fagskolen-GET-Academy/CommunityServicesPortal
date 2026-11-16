using CommunityServicesPortal.Api.Domain;

namespace CommunityServicesPortal.Api.Application;

public static class CaseRules
{
    public static bool CanTransition(CaseStatus from, CaseStatus to) => (from, to) switch
    {
        (CaseStatus.Submitted, CaseStatus.InProgress) => true,
        (CaseStatus.InProgress, CaseStatus.WaitingForCitizen or CaseStatus.Resolved) => true,
        (CaseStatus.WaitingForCitizen, CaseStatus.InProgress) => true,
        (CaseStatus.Resolved, CaseStatus.Closed) => true,
        _ => false
    };

    public static string RequiredText(string? value, string label, int maxLength)
    {
        var text = value?.Trim() ?? "";
        if (text.Length == 0 || text.Length > maxLength)
            throw new RuleException(400, $"{label} må ha mellom 1 og {maxLength} tegn.");
        return text;
    }

    public static CitizenCase Create(CreateCaseRequest request, int citizenId)
    {
        if (!Enum.IsDefined(request.Type) || !Enum.IsDefined(request.PublicationSetting))
            throw new RuleException(400, "Velg gyldig sakstype og publiseringsvalg.");
        var item = new CitizenCase
        {
            CitizenId = citizenId, Type = request.Type,
            Title = RequiredText(request.Title, "Tittel", 120),
            Description = RequiredText(request.Description, "Beskrivelse", 4000),
            Location = RequiredText(request.Location, "Sted", 300),
            PublicationSetting = request.PublicationSetting, Status = CaseStatus.Submitted,
            CreatedAt = DateTimeOffset.UtcNow.ToString("O"), UpdatedAt = DateTimeOffset.UtcNow.ToString("O")
        };
        switch (request.Type)
        {
            case CaseType.Problem:
                if (request.ImpactLevel is null || !Enum.IsDefined(request.ImpactLevel.Value) || request.IsSafetyRisk is null)
                    throw new RuleException(400, "Velg påvirkningsgrad og svar på om problemet er en sikkerhetsrisiko.");
                item.ImpactLevel = request.ImpactLevel;
                item.IsSafetyRisk = request.IsSafetyRisk;
                break;
            case CaseType.MaintenanceObservation:
                item.ObservedChange = RequiredText(request.ObservedChange, "Observasjon", 1000);
                if (request.MayGetWorse is null) throw new RuleException(400, "Svar på om tilstanden kan bli verre.");
                item.MayGetWorse = request.MayGetWorse;
                break;
            case CaseType.ImprovementSuggestion:
                item.ProposedImprovement = RequiredText(request.ProposedImprovement, "Foreslått forbedring", 1000);
                item.ExpectedBenefit = RequiredText(request.ExpectedBenefit, "Forventet nytte", 1000);
                break;
        }
        // Fields belonging to other types are discarded, so the stored model stays consistent.
        return item;
    }
}
