using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Security;

public sealed class JwtTokenService(IConfiguration configuration)
{
    public const string Issuer = "SmartMenu.Api";
    public const string Audience = "SmartMenu.Clients";

    public bool IsConfigured => Encoding.UTF8.GetByteCount(configuration["Jwt:Key"] ?? "") >= 32;

    public (string Token, DateTime ExpiresAt) Create(AppUser user)
    {
        var now = DateTime.UtcNow;
        var expiresAt = now.AddHours(2);
        var credentials = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!)),
            SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Audience,
            claims:
            [
                new Claim(JwtRegisteredClaimNames.Sub, user.UserId.ToString()),
                new Claim("role", user.Role),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            ],
            notBefore: now,
            expires: expiresAt,
            signingCredentials: credentials);
        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }
}
