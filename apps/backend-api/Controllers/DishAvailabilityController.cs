using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.RestaurantAdmin)]
[Route("admin/restaurants/{restaurantId:int}/dishes/{dishId:int}/availability")]
public sealed class DishAvailabilityController(SmartMenuDbContext db) : ControllerBase
{
    [HttpPatch]
    public async Task<ActionResult<DishAvailabilityResponse>> SetAvailability(
        int restaurantId, int dishId, DishAvailabilityRequest request,
        CancellationToken cancellationToken)
    {
        if (!await RestaurantAdminAccess.CanManageAsync(
                db, User, restaurantId, cancellationToken)) return Forbid();

        var dish = await db.Dishes.SingleOrDefaultAsync(x =>
            x.DishId == dishId && x.RestaurantId == restaurantId,
            cancellationToken);
        if (dish is null) return NotFound();
        if (dish.Status == DishStatuses.Archived)
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Архівну страву не можна додавати до стоп-листа."
            });

        var status = request.IsAvailable!.Value
            ? DishStatuses.Available : DishStatuses.Unavailable;
        if (dish.Status != status)
        {
            dish.Status = status;
            dish.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        return Ok(new DishAvailabilityResponse(dish.DishId, dish.Status, dish.UpdatedAt));
    }
}

public sealed class DishAvailabilityRequest
{
    [Required(ErrorMessage = "Вкажіть доступність страви.")]
    public bool? IsAvailable { get; set; }
}

public sealed record DishAvailabilityResponse(int Id, string Status, DateTime UpdatedAt);
