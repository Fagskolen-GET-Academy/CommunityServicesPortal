using CommunityServicesPortal.Api.Domain;
using CommunityServicesPortal.Api.Infrastructure;

namespace CommunityServicesPortal.Api.Application;

public sealed class CaseService(CaseRepository cases, UserRepository users)
{
    public int Create(CreateCaseRequest request, int citizenId) => cases.Create(CaseRules.Create(request, citizenId));
    public IReadOnlyList<CitizenCase> MyCases(int citizenId) => cases.List(citizenId);
    public IReadOnlyList<CitizenCase> WorkerCases(CaseStatus? status, int? assignedTo) => cases.List(status: status, assignedTo: assignedTo);
    public IReadOnlyList<WorkerDto> Workers() => users.Workers();

    private CitizenCase RequireCase(int id) => cases.Find(id) ?? throw new RuleException(404, "Fant ikke saken.");

    private CitizenCase RequireOwner(int id, int citizenId)
    {
        var item = RequireCase(id);
        // Return the same response for absent and inaccessible cases.
        if (item.CitizenId != citizenId) throw new RuleException(404, "Fant ikke saken.");
        return item;
    }

    private CaseDetails Details(CitizenCase item) => new(item, users.Find(item.CitizenId)!.Name,
        item.AssignedCaseWorkerId is int workerId ? users.Find(workerId)?.Name : null,
        cases.Messages(item.Id), cases.History(item.Id));

    public CaseDetails CitizenDetails(int id, int citizenId) => Details(RequireOwner(id, citizenId));
    public CaseDetails WorkerDetails(int id) => Details(RequireCase(id));

    public void CitizenMessage(int id, int citizenId, string? text)
    {
        RequireOwner(id, citizenId);
        cases.AddMessage(id, citizenId, CaseRules.RequiredText(text, "Melding", 2000));
    }

    public void WorkerMessage(int id, int workerId, string? text)
    {
        RequireCase(id);
        cases.AddMessage(id, workerId, CaseRules.RequiredText(text, "Melding", 2000));
    }

    public void Assign(int id, int? workerId)
    {
        RequireCase(id);
        if (workerId is int value && users.Find(value)?.Role != UserRole.CaseWorker)
            throw new RuleException(400, "Velg en gyldig saksbehandler.");
        cases.Assign(id, workerId);
    }

    public void ChangeStatus(int id, CaseStatus to, int workerId)
    {
        var item = RequireCase(id);
        if (!CaseRules.CanTransition(item.Status, to))
            throw new RuleException(409, "Denne statusovergangen er ikke tillatt.");
        cases.ChangeStatus(id, item.Status, to, workerId);
    }
}
