using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("auth")]
public sealed class AuthController(
    SmartMenuDbContext db,
    IPasswordHasher<AppUser> passwordHasher,
    JwtTokenService tokens) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthUserResponse>> Register(
        RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Користувач із такою адресою email вже існує."
            });
        }

        var now = DateTime.UtcNow;
        var account = new AppUser
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            Role = AppRoles.RegisteredUser,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        account.PasswordHash = passwordHasher.HashPassword(account, request.Password);
        db.Users.Add(account);

        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Користувач із такою адресою email вже існує."
            });
        }

        return StatusCode(StatusCodes.Status201Created, AuthUserResponse.From(account, []));
    }

    [HttpPost("login")]
    public async Task<ActionResult<LoginResponse>> Login(
        LoginRequest request, CancellationToken cancellationToken)
    {
        if (!tokens.IsConfigured)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new ProblemDetails
            {
                Status = StatusCodes.Status503ServiceUnavailable,
                Title = "Вхід тимчасово недоступний."
            });
        }

        var email = request.Email.Trim().ToLowerInvariant();
        var account = await db.Users.SingleOrDefaultAsync(x => x.Email == email, cancellationToken);
        if (account is null || !account.IsActive || account.PasswordHash is null ||
            passwordHasher.VerifyHashedPassword(account, account.PasswordHash, request.Password)
                == PasswordVerificationResult.Failed)
        {
            return Unauthorized(new ProblemDetails
            {
                Status = StatusCodes.Status401Unauthorized,
                Title = "Неправильний email або пароль чи обліковий запис неактивний."
            });
        }

        var restaurantIds = account.Role == AppRoles.RestaurantAdmin
            ? await db.RestaurantAdminAssignments.AsNoTracking()
                .Where(x => x.UserId == account.UserId)
                .OrderBy(x => x.RestaurantId)
                .Select(x => x.RestaurantId)
                .ToArrayAsync(cancellationToken)
            : [];
        if (account.Role == AppRoles.RestaurantAdmin && restaurantIds.Length == 0)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new ProblemDetails
            {
                Status = StatusCodes.Status403Forbidden,
                Title = "Адміністратору не призначено жодного закладу."
            });
        }

        var (token, expiresAt) = tokens.Create(account);
        return Ok(new LoginResponse(token, expiresAt, AuthUserResponse.From(account, restaurantIds)));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserResponse>> GetCurrent(CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirstValue("sub")!);
        var account = await db.Users.AsNoTracking()
            .SingleAsync(x => x.UserId == userId, cancellationToken);
        var restaurantIds = account.Role == AppRoles.RestaurantAdmin
            ? await db.RestaurantAdminAssignments.AsNoTracking()
                .Where(x => x.UserId == userId)
                .OrderBy(x => x.RestaurantId)
                .Select(x => x.RestaurantId)
                .ToArrayAsync(cancellationToken)
            : [];
        return Ok(AuthUserResponse.From(account, restaurantIds));
    }
}

public sealed class RegisterRequest : IValidatableObject
{
    [Required(ErrorMessage = "Вкажіть ім'я.")]
    [StringLength(100, ErrorMessage = "Ім'я не може перевищувати 100 символів.")]
    public string FirstName { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть прізвище.")]
    [StringLength(100, ErrorMessage = "Прізвище не може перевищувати 100 символів.")]
    public string LastName { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть email.")]
    [EmailAddress(ErrorMessage = "Неправильний формат email.")]
    [StringLength(320, ErrorMessage = "Email не може перевищувати 320 символів.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть пароль.")]
    [StringLength(128, MinimumLength = 8,
        ErrorMessage = "Пароль повинен містити від 8 до 128 символів.")]
    public string Password { get; set; } = "";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(FirstName))
            yield return new ValidationResult("Вкажіть ім'я.", [nameof(FirstName)]);
        if (string.IsNullOrWhiteSpace(LastName))
            yield return new ValidationResult("Вкажіть прізвище.", [nameof(LastName)]);
        if (string.IsNullOrWhiteSpace(Email))
            yield return new ValidationResult("Вкажіть email.", [nameof(Email)]);
    }
}

public sealed class LoginRequest
{
    [Required(ErrorMessage = "Вкажіть email.")]
    [EmailAddress(ErrorMessage = "Неправильний формат email.")]
    public string Email { get; set; } = "";

    [Required(ErrorMessage = "Вкажіть пароль.")]
    public string Password { get; set; } = "";
}

public sealed record AuthUserResponse(
    int Id,
    string? Email,
    string FirstName,
    string LastName,
    string Role,
    bool IsActive,
    IReadOnlyList<int> RestaurantIds)
{
    public static AuthUserResponse From(AppUser account, IReadOnlyList<int> restaurantIds) => new(
        account.UserId, account.Email, account.FirstName, account.LastName,
        account.Role, account.IsActive, restaurantIds);
}

public sealed record LoginResponse(string Token, DateTime ExpiresAt, AuthUserResponse User);
