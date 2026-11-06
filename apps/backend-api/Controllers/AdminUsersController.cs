using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.SystemAdmin)]
[Route("admin/users")]
public sealed class AdminUsersController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<AccountPage>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize is < 1 or > 100 || page - 1 > int.MaxValue / pageSize)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Некоректні параметри сторінки."
            });

        var total = await db.Users.CountAsync(cancellationToken);
        var accounts = await db.Users.AsNoTracking()
            .OrderBy(x => x.UserId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        var ids = accounts.Select(x => x.UserId).ToArray();
        var assignments = await db.RestaurantAdminAssignments.AsNoTracking()
            .Where(x => ids.Contains(x.UserId))
            .OrderBy(x => x.RestaurantId)
            .Select(x => new { x.UserId, x.RestaurantId })
            .ToListAsync(cancellationToken);
        var restaurantIds = assignments.GroupBy(x => x.UserId)
            .ToDictionary(x => x.Key, x => x.Select(y => y.RestaurantId).ToArray());
        var items = accounts.Select(x => AccountResponse.From(
            x, restaurantIds.GetValueOrDefault(x.UserId) ?? [])).ToArray();
        return Ok(new AccountPage(items, total, page, pageSize));
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<AccountResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var account = await db.Users.AsNoTracking()
            .SingleOrDefaultAsync(x => x.UserId == id, cancellationToken);
        if (account is null) return NotFound();
        var restaurantIds = await GetRestaurantIds(id, cancellationToken);
        return Ok(AccountResponse.From(account, restaurantIds));
    }

    [HttpPatch("{id:int}/active")]
    public async Task<ActionResult<AccountResponse>> SetActive(
        int id, SetActiveRequest request, CancellationToken cancellationToken)
    {
        var account = await db.Users.SingleOrDefaultAsync(x => x.UserId == id, cancellationToken);
        if (account is null) return NotFound();
        var currentUserId = int.Parse(User.FindFirstValue("sub")!);
        if (id == currentUserId && !request.IsActive!.Value)
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Неможливо деактивувати власний обліковий запис."
            });

        if (account.IsActive != request.IsActive!.Value)
        {
            account.IsActive = request.IsActive.Value;
            account.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        return Ok(AccountResponse.From(account,
            await GetRestaurantIds(id, cancellationToken)));
    }

    [HttpPost("{id:int}/restaurants/{restaurantId:int}")]
    public async Task<ActionResult<AccountResponse>> AssignRestaurant(
        int id, int restaurantId, CancellationToken cancellationToken)
    {
        var account = await db.Users.SingleOrDefaultAsync(x => x.UserId == id, cancellationToken);
        if (account is null) return NotFound();
        var restaurant = await db.Restaurants.AsNoTracking()
            .SingleOrDefaultAsync(x => x.RestaurantId == restaurantId, cancellationToken);
        if (restaurant is null) return NotFound();
        if (restaurant.Status == RestaurantStatuses.Inactive)
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Неможливо призначити адміністратора неактивному закладу."
            });
        if (account.Role == AppRoles.SystemAdmin)
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Системного адміністратора не можна призначити адміністратором закладу."
            });

        var exists = await db.RestaurantAdminAssignments.AnyAsync(
            x => x.UserId == id && x.RestaurantId == restaurantId, cancellationToken);
        if (!exists)
        {
            db.RestaurantAdminAssignments.Add(new RestaurantAdminAssignment
            {
                UserId = id,
                RestaurantId = restaurantId,
                CreatedAt = DateTime.UtcNow
            });
            account.Role = AppRoles.RestaurantAdmin;
            account.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        return Ok(AccountResponse.From(account,
            await GetRestaurantIds(id, cancellationToken)));
    }

    [HttpDelete("{id:int}/restaurants/{restaurantId:int}")]
    public async Task<ActionResult<AccountResponse>> RemoveRestaurant(
        int id, int restaurantId, CancellationToken cancellationToken)
    {
        var account = await db.Users.SingleOrDefaultAsync(x => x.UserId == id, cancellationToken);
        if (account is null) return NotFound();
        var assignment = await db.RestaurantAdminAssignments.SingleOrDefaultAsync(
            x => x.UserId == id && x.RestaurantId == restaurantId, cancellationToken);
        if (assignment is null) return NotFound();

        db.RestaurantAdminAssignments.Remove(assignment);
        var hasOtherAssignments = await db.RestaurantAdminAssignments.AnyAsync(
            x => x.UserId == id && x.AssignmentId != assignment.AssignmentId, cancellationToken);
        if (!hasOtherAssignments) account.Role = AppRoles.RegisteredUser;
        account.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(AccountResponse.From(account,
            await GetRestaurantIds(id, cancellationToken)));
    }

    private async Task<int[]> GetRestaurantIds(int userId, CancellationToken cancellationToken) =>
        await db.RestaurantAdminAssignments.AsNoTracking()
            .Where(x => x.UserId == userId)
            .OrderBy(x => x.RestaurantId)
            .Select(x => x.RestaurantId)
            .ToArrayAsync(cancellationToken);
}

public sealed class SetActiveRequest
{
    [Required(ErrorMessage = "Вкажіть стан активності.")]
    public bool? IsActive { get; set; }
}

public sealed record AccountResponse(
    int Id,
    string? Email,
    string FirstName,
    string LastName,
    string? PhoneNumber,
    string Role,
    bool IsActive,
    IReadOnlyList<int> RestaurantIds)
{
    public static AccountResponse From(AppUser account, IReadOnlyList<int> restaurantIds) => new(
        account.UserId, account.Email, account.FirstName, account.LastName,
        account.PhoneNumber, account.Role, account.IsActive, restaurantIds);
}

public sealed record AccountPage(IReadOnlyList<AccountResponse> Items, int Total, int Page, int PageSize);
