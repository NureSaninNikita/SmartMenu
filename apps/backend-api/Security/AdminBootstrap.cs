using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Security;

public static class AdminBootstrap
{
    public static async Task InitializeAsync(IServiceProvider services, IConfiguration configuration)
    {
        var email = configuration["BootstrapAdmin:Email"];
        if (string.IsNullOrWhiteSpace(email)) return;

        var firstName = configuration["BootstrapAdmin:FirstName"];
        var lastName = configuration["BootstrapAdmin:LastName"];
        var password = configuration["BootstrapAdmin:Password"];
        if (email.Length > 320 || !new EmailAddressAttribute().IsValid(email) ||
            string.IsNullOrWhiteSpace(firstName) || firstName.Length > 100 ||
            string.IsNullOrWhiteSpace(lastName) || lastName.Length > 100 ||
            password is null || password.Length is < 8 or > 128)
        {
            throw new InvalidOperationException("Invalid BootstrapAdmin configuration.");
        }

        await using var scope = services.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<SmartMenuDbContext>();
        if (await db.Users.AnyAsync(x => x.Role == AppRoles.SystemAdmin)) return;

        email = email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(x => x.Email == email))
            throw new InvalidOperationException("BootstrapAdmin email is already in use.");

        var now = DateTime.UtcNow;
        var account = new AppUser
        {
            Email = email,
            FirstName = firstName.Trim(),
            LastName = lastName.Trim(),
            Role = AppRoles.SystemAdmin,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        var hasher = scope.ServiceProvider.GetRequiredService<IPasswordHasher<AppUser>>();
        account.PasswordHash = hasher.HashPassword(account, password);
        db.Users.Add(account);
        await db.SaveChangesAsync();
    }
}
