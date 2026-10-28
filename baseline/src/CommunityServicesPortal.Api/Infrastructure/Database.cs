using Dapper;
using Microsoft.AspNetCore.Identity;
using Microsoft.Data.Sqlite;
using CommunityServicesPortal.Api.Domain;

namespace CommunityServicesPortal.Api.Infrastructure;

public sealed class Database(IConfiguration configuration, IWebHostEnvironment environment)
{
    private readonly string path = Path.GetFullPath(configuration["Database:Path"] ?? "App_Data/community-services.db",
        environment.ContentRootPath);

    public SqliteConnection Open()
    {
        var connection = new SqliteConnection(new SqliteConnectionStringBuilder
        {
            DataSource = path, ForeignKeys = true, DefaultTimeout = 10, Pooling = false
        }.ToString());
        connection.Open();
        return connection;
    }

    public void Initialize(bool seed)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        using var connection = Open();
        connection.Execute("""
            CREATE TABLE IF NOT EXISTS Users (
              Id INTEGER PRIMARY KEY, Name TEXT NOT NULL, Email TEXT NOT NULL UNIQUE COLLATE NOCASE,
              PasswordHash TEXT NOT NULL, Role TEXT NOT NULL CHECK(Role IN ('Citizen','CaseWorker')));
            CREATE TABLE IF NOT EXISTS Cases (
              Id INTEGER PRIMARY KEY AUTOINCREMENT, Type TEXT NOT NULL CHECK(Type IN ('Problem','MaintenanceObservation','ImprovementSuggestion')),
              CitizenId INTEGER NOT NULL REFERENCES Users(Id), AssignedCaseWorkerId INTEGER REFERENCES Users(Id),
              Title TEXT NOT NULL, Description TEXT NOT NULL, Location TEXT NOT NULL,
              Status TEXT NOT NULL CHECK(Status IN ('Submitted','InProgress','WaitingForCitizen','Resolved','Closed')),
              PublicationSetting TEXT NOT NULL CHECK(PublicationSetting IN ('PublicAnonymous','PublicWithName','NotPublished')),
              CreatedAt TEXT NOT NULL, UpdatedAt TEXT NOT NULL,
              ImpactLevel TEXT, IsSafetyRisk INTEGER, ObservedChange TEXT, MayGetWorse INTEGER,
              ProposedImprovement TEXT, ExpectedBenefit TEXT);
            CREATE TABLE IF NOT EXISTS CaseMessages (
              Id INTEGER PRIMARY KEY AUTOINCREMENT, CaseId INTEGER NOT NULL REFERENCES Cases(Id) ON DELETE CASCADE,
              AuthorUserId INTEGER NOT NULL REFERENCES Users(Id), Text TEXT NOT NULL, CreatedAt TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS CaseStatusHistory (
              Id INTEGER PRIMARY KEY AUTOINCREMENT, CaseId INTEGER NOT NULL REFERENCES Cases(Id) ON DELETE CASCADE,
              FromStatus TEXT, ToStatus TEXT NOT NULL, ChangedByUserId INTEGER NOT NULL REFERENCES Users(Id), ChangedAt TEXT NOT NULL);
            CREATE TABLE IF NOT EXISTS CaseSupport (
              CaseId INTEGER NOT NULL REFERENCES Cases(Id) ON DELETE CASCADE,
              CitizenId INTEGER NOT NULL REFERENCES Users(Id), CreatedAt TEXT NOT NULL,
              PRIMARY KEY (CaseId, CitizenId));
            CREATE INDEX IF NOT EXISTS IX_Cases_Citizen ON Cases(CitizenId);
            CREATE INDEX IF NOT EXISTS IX_Messages_Case ON CaseMessages(CaseId);
            CREATE INDEX IF NOT EXISTS IX_History_Case ON CaseStatusHistory(CaseId);
            """);
        if (seed && connection.ExecuteScalar<int>("SELECT COUNT(*) FROM Users") == 0) Seed(connection);
    }

    public void Reset()
    {
        using var connection = Open();
        Seed(connection);
    }

    private static void Seed(SqliteConnection connection)
    {
        using var transaction = connection.BeginTransaction();
        connection.Execute("""
            DELETE FROM CaseSupport; DELETE FROM CaseMessages; DELETE FROM CaseStatusHistory;
            DELETE FROM Cases; DELETE FROM Users;
            DELETE FROM sqlite_sequence WHERE name IN ('Cases','CaseMessages','CaseStatusHistory');
            """, transaction: transaction);
        var hasher = new PasswordHasher<User>();
        User[] users =
        [
            new() { Id = 1, Name = "Kari Nordmann", Email = "citizen1@example.test", Role = UserRole.Citizen },
            new() { Id = 2, Name = "Ahmed Hassan", Email = "citizen2@example.test", Role = UserRole.Citizen },
            new() { Id = 3, Name = "Nora Hansen", Email = "worker1@example.test", Role = UserRole.CaseWorker },
            new() { Id = 4, Name = "Jonas Berg", Email = "worker2@example.test", Role = UserRole.CaseWorker }
        ];
        foreach (var user in users)
        {
            user.PasswordHash = hasher.HashPassword(user, "Demo123!");
            connection.Execute("INSERT INTO Users VALUES (@Id,@Name,@Email,@PasswordHash,@Role)",
                new { user.Id, user.Name, user.Email, user.PasswordHash, Role = user.Role.ToString() }, transaction);
        }
        connection.Execute("""
            INSERT INTO Cases (Id,Type,CitizenId,AssignedCaseWorkerId,Title,Description,Location,Status,PublicationSetting,CreatedAt,UpdatedAt,ImpactLevel,IsSafetyRisk,ObservedChange,MayGetWorse,ProposedImprovement,ExpectedBenefit) VALUES
            (1001,'Problem',1,3,'Tre over turstien','Et tre har blåst ned og blokkerer hele turstien.','Turstien ved Bøkeskogen, 200 meter nord for parkeringsplassen','InProgress','PublicAnonymous','2026-10-20T08:00:00.0000000+00:00','2026-10-21T09:00:00.0000000+00:00','High',1,NULL,NULL,NULL,NULL),
            (1002,'ImprovementSuggestion',1,NULL,'Sykkelparkering ved holdeplassen','Det mangler et sted å sette fra seg sykkelen.','Holdeplassen ved Torget','Submitted','PublicWithName','2026-10-22T10:00:00.0000000+00:00','2026-10-22T10:00:00.0000000+00:00',NULL,NULL,NULL,NULL,'Tre sykkelstativer ved holdeplassen.','Enklere å kombinere sykkel og kollektivtransport.'),
            (1003,'MaintenanceObservation',2,4,'Knust vindu i kommunalt bygg','Ett vindu i det gamle kommunale bygget er knust. Resten er hele, men bygget står tomt.','Det gamle kommunale bygget i Parkveien 12','WaitingForCitizen','NotPublished','2026-10-19T12:00:00.0000000+00:00','2026-10-23T11:00:00.0000000+00:00',NULL,NULL,'Ett knust vindu i første etasje.',1,NULL,NULL),
            (1004,'MaintenanceObservation',2,3,'Erosjon ved bekken','Jord skylles ut fra kanten ved gangbroen.','Gangbroen over bekken i Sørparken','InProgress','PublicAnonymous','2026-10-24T10:00:00.0000000+00:00','2026-10-25T09:00:00.0000000+00:00',NULL,NULL,'Det er blitt et synlig søkk etter regnet.',1,NULL,NULL);
            INSERT INTO CaseMessages (CaseId,AuthorUserId,Text,CreatedAt) VALUES
            (1001,3,'Takk for meldingen. Vi har bestilt rydding av turstien.','2026-10-21T09:00:00.0000000+00:00'),
            (1003,4,'Kan du beskrive hvilken side av bygget vinduet er på?','2026-10-23T11:00:00.0000000+00:00');
            INSERT INTO CaseStatusHistory (CaseId,FromStatus,ToStatus,ChangedByUserId,ChangedAt) VALUES
            (1001,NULL,'Submitted',1,'2026-10-20T08:00:00.0000000+00:00'),
            (1001,'Submitted','InProgress',3,'2026-10-21T09:00:00.0000000+00:00'),
            (1002,NULL,'Submitted',1,'2026-10-22T10:00:00.0000000+00:00'),
            (1003,NULL,'Submitted',2,'2026-10-19T12:00:00.0000000+00:00'),
            (1003,'Submitted','InProgress',4,'2026-10-20T10:00:00.0000000+00:00'),
            (1003,'InProgress','WaitingForCitizen',4,'2026-10-23T11:00:00.0000000+00:00'),
            (1004,NULL,'Submitted',2,'2026-10-24T10:00:00.0000000+00:00'),
            (1004,'Submitted','InProgress',3,'2026-10-25T09:00:00.0000000+00:00');
            INSERT INTO CaseSupport VALUES (1001,2,'2026-10-22T12:00:00.0000000+00:00');
            """, transaction: transaction);
        transaction.Commit();
    }
}
