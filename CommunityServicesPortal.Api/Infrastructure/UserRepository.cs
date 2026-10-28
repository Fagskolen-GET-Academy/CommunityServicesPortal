using Dapper;
using CommunityServicesPortal.Api.Domain;
using CommunityServicesPortal.Api.Application;

namespace CommunityServicesPortal.Api.Infrastructure;

public sealed class UserRepository(Database database)
{
    public User? FindByEmail(string email)
    {
        using var connection = database.Open();
        return connection.QuerySingleOrDefault<User>("SELECT * FROM Users WHERE Email=@email", new { email });
    }

    public User? Find(int id)
    {
        using var connection = database.Open();
        return connection.QuerySingleOrDefault<User>("SELECT * FROM Users WHERE Id=@id", new { id });
    }

    public IReadOnlyList<WorkerDto> Workers()
    {
        using var connection = database.Open();
        return connection.Query<WorkerDto>("SELECT Id,Name FROM Users WHERE Role='CaseWorker' ORDER BY Name").AsList();
    }

    public void UpdateHash(int id, string hash)
    {
        using var connection = database.Open();
        connection.Execute("UPDATE Users SET PasswordHash=@hash WHERE Id=@id", new { id, hash });
    }
}
