using System.Security.Claims;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Security;

public static class RestaurantAdminAccess
{
    public static async Task<bool> CanManageAsync(
        SmartMenuDbContext db, ClaimsPrincipal principal, int restaurantId,
        CancellationToken cancellationToken)
    {
        if (!int.TryParse(principal.FindFirstValue("sub"), out var userId)) return false;

        return await db.RestaurantAdminAssignments.AsNoTracking()
            .AnyAsync(x => x.UserId == userId && x.RestaurantId == restaurantId,
                cancellationToken);
    }
}
