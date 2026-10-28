using Dapper;
using CommunityServicesPortal.Api.Application;
using CommunityServicesPortal.Api.Domain;

namespace CommunityServicesPortal.Api.Infrastructure;

public sealed class CaseRepository(Database database)
{
    public CitizenCase? Find(int id)
    {
        using var connection = database.Open();
        return connection.QuerySingleOrDefault<CitizenCase>("SELECT * FROM Cases WHERE Id=@id", new { id });
    }

    public IReadOnlyList<CitizenCase> List(int? citizenId = null, CaseStatus? status = null, int? assignedTo = null)
    {
        using var connection = database.Open();
        return connection.Query<CitizenCase>("""
            SELECT * FROM Cases WHERE (@citizenId IS NULL OR CitizenId=@citizenId)
              AND (@status IS NULL OR Status=@status) AND (@assignedTo IS NULL OR AssignedCaseWorkerId=@assignedTo)
            ORDER BY CreatedAt DESC, Id DESC
            """, new { citizenId, status = status?.ToString(), assignedTo }).AsList();
    }

    public IReadOnlyList<PublicCaseDto> PublicList(int? viewerId, CaseType? type, CaseStatus? status, int? id = null)
    {
        using var connection = database.Open();
        return connection.Query<PublicCaseDto>("""
            SELECT c.Id,c.Type,c.Title,c.Description,c.Location,c.Status,c.CreatedAt,c.UpdatedAt,
              CASE WHEN c.PublicationSetting='PublicWithName' THEN u.Name ELSE NULL END AS CitizenName,
              (SELECT COUNT(*) FROM CaseSupport s WHERE s.CaseId=c.Id) AS SupportCount,
              EXISTS(SELECT 1 FROM CaseSupport s WHERE s.CaseId=c.Id AND s.CitizenId=@viewerId) AS SupportedByMe,
              c.Type IN ('Problem','MaintenanceObservation') AS CanSupport
            FROM Cases c JOIN Users u ON u.Id=c.CitizenId
            WHERE c.PublicationSetting IN ('PublicAnonymous','PublicWithName')
              AND (@id IS NULL OR c.Id=@id) AND (@type IS NULL OR c.Type=@type)
              AND (@status IS NULL OR c.Status=@status)
            ORDER BY c.CreatedAt DESC,c.Id DESC
            """, new { viewerId, type = type?.ToString(), status = status?.ToString(), id }).AsList();
    }

    public int Create(CitizenCase item)
    {
        using var connection = database.Open();
        using var transaction = connection.BeginTransaction();
        var id = connection.ExecuteScalar<int>("""
            INSERT INTO Cases (Type,CitizenId,Title,Description,Location,Status,PublicationSetting,CreatedAt,UpdatedAt,
              ImpactLevel,IsSafetyRisk,ObservedChange,MayGetWorse,ProposedImprovement,ExpectedBenefit)
            VALUES (@Type,@CitizenId,@Title,@Description,@Location,@Status,@PublicationSetting,@CreatedAt,@UpdatedAt,
              @ImpactLevel,@IsSafetyRisk,@ObservedChange,@MayGetWorse,@ProposedImprovement,@ExpectedBenefit);
            SELECT last_insert_rowid();
            """, new
        {
            Type = item.Type.ToString(), item.CitizenId, item.Title, item.Description, item.Location,
            Status = item.Status.ToString(), PublicationSetting = item.PublicationSetting.ToString(),
            item.CreatedAt, item.UpdatedAt, ImpactLevel = item.ImpactLevel?.ToString(), item.IsSafetyRisk,
            item.ObservedChange, item.MayGetWorse, item.ProposedImprovement, item.ExpectedBenefit
        }, transaction);
        connection.Execute("""
            INSERT INTO CaseStatusHistory (CaseId,FromStatus,ToStatus,ChangedByUserId,ChangedAt)
            VALUES (@id,NULL,'Submitted',@CitizenId,@CreatedAt)
            """, new { id, item.CitizenId, item.CreatedAt }, transaction);
        transaction.Commit();
        return id;
    }

    public IReadOnlyList<CaseMessage> Messages(int id)
    {
        using var connection = database.Open();
        return connection.Query<CaseMessage>("""
            SELECT m.*, u.Name AS AuthorName, u.Role AS AuthorRole FROM CaseMessages m
            JOIN Users u ON u.Id=m.AuthorUserId WHERE m.CaseId=@id ORDER BY m.CreatedAt,m.Id
            """, new { id }).AsList();
    }

    public IReadOnlyList<CaseStatusHistory> History(int id)
    {
        using var connection = database.Open();
        return connection.Query<CaseStatusHistory>(
            "SELECT * FROM CaseStatusHistory WHERE CaseId=@id ORDER BY ChangedAt,Id", new { id }).AsList();
    }

    public void AddMessage(int id, int authorId, string text)
    {
        using var connection = database.Open();
        using var transaction = connection.BeginTransaction();
        var now = DateTimeOffset.UtcNow.ToString("O");
        connection.Execute("""
            INSERT INTO CaseMessages (CaseId,AuthorUserId,Text,CreatedAt) VALUES (@id,@authorId,@text,@now);
            UPDATE Cases SET UpdatedAt=@now WHERE Id=@id;
            """, new { id, authorId, text, now }, transaction);
        transaction.Commit();
    }

    public void Assign(int id, int? workerId)
    {
        using var connection = database.Open();
        connection.Execute("UPDATE Cases SET AssignedCaseWorkerId=@workerId,UpdatedAt=@now WHERE Id=@id",
            new { id, workerId, now = DateTimeOffset.UtcNow.ToString("O") });
    }

    public void ChangeStatus(int id, CaseStatus from, CaseStatus to, int userId)
    {
        using var connection = database.Open();
        using var transaction = connection.BeginTransaction();
        var parameters = new { id, from = from.ToString(), to = to.ToString(), userId, now = DateTimeOffset.UtcNow.ToString("O") };
        var changed = connection.Execute("UPDATE Cases SET Status=@to,UpdatedAt=@now WHERE Id=@id AND Status=@from",
            parameters, transaction);
        if (changed == 0) throw new RuleException(409, "Status er endret av en annen saksbehandler. Last saken på nytt.");
        connection.Execute("""
            INSERT INTO CaseStatusHistory (CaseId,FromStatus,ToStatus,ChangedByUserId,ChangedAt)
            VALUES (@id,@from,@to,@userId,@now)
            """, parameters, transaction);
        transaction.Commit();
    }

    public bool Support(int id, int citizenId)
    {
        using var connection = database.Open();
        // The composite primary key also enforces uniqueness for concurrent requests.
        return connection.Execute("""
            INSERT INTO CaseSupport (CaseId,CitizenId,CreatedAt) VALUES (@id,@citizenId,@now)
            ON CONFLICT(CaseId,CitizenId) DO NOTHING
            """, new { id, citizenId, now = DateTimeOffset.UtcNow.ToString("O") }) == 1;
    }
}
