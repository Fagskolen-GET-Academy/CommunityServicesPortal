using CommunityServicesPortal.Api.Domain;
using CommunityServicesPortal.Api.Infrastructure;

namespace CommunityServicesPortal.Api.Application;

public sealed class PublicCaseService(CaseRepository cases)
{
    public IReadOnlyList<PublicCaseDto> List(int? viewerId, CaseType? type, CaseStatus? status) => cases.PublicList(viewerId, type, status);

    public PublicCaseDto Details(int id, int? viewerId) => cases.PublicList(viewerId, null, null, id).SingleOrDefault()
        ?? throw new RuleException(404, "Fant ikke den offentlige saken.");

    public void Support(int id, int citizenId)
    {
        var item = Details(id, citizenId);
        if (cases.Find(id)?.CitizenId == citizenId)
            throw new RuleException(400, "Du kan ikke registrere støtte på din egen sak.");
        if (!item.CanSupport) throw new RuleException(400, "Støtte er tilgjengelig for problem- og vedlikeholdssaker.");
        if (!cases.Support(id, citizenId)) throw new RuleException(409, "Du har allerede registrert at du opplever dette også.");
    }
}
