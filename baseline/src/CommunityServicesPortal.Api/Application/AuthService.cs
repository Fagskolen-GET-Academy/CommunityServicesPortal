using CommunityServicesPortal.Api.Domain;
using CommunityServicesPortal.Api.Infrastructure;
using Microsoft.AspNetCore.Identity;

namespace CommunityServicesPortal.Api.Application;

public sealed class AuthService(UserRepository users, IPasswordHasher<User> hasher)
{
    public UserDto Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || request.Email.Length > 254 ||
            string.IsNullOrEmpty(request.Password) || request.Password.Length > 256)
            throw new RuleException(400, "Oppgi e-post og passord.");
        var user = users.FindByEmail(request.Email.Trim());
        if (user is null) throw new RuleException(401, "E-post eller passord er feil.");
        var verification = hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (verification == PasswordVerificationResult.Failed)
            throw new RuleException(401, "E-post eller passord er feil.");
        if (verification == PasswordVerificationResult.SuccessRehashNeeded)
            users.UpdateHash(user.Id, hasher.HashPassword(user, request.Password));
        return new UserDto(user.Id, user.Name, user.Email, user.Role);
    }
}
