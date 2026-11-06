using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("restaurants/{restaurantId:int}")]
public sealed class DishSearchController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet("dishes")]
    public async Task<ActionResult<DishSearchPage>> Search(
        int restaurantId,
        [FromQuery] string? query,
        [FromQuery] int? categoryId,
        [FromQuery] int[]? ingredientIds,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var unavailable = await CheckRestaurant(restaurantId, cancellationToken);
        if (unavailable is not null) return unavailable;

        var term = query?.Trim();
        if (term?.Length > 200 || categoryId is <= 0 ||
            ingredientIds?.Any(id => id <= 0) == true || page < 1 || pageSize is < 1 or > 100 ||
            page - 1 > int.MaxValue / pageSize)
        {
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Некоректні параметри пошуку."
            });
        }

        var dishes = db.Dishes.AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId &&
                x.Status != DishStatuses.Archived && x.Category.IsActive);
        if (!string.IsNullOrEmpty(term))
            dishes = dishes.Where(x => EF.Functions.Collate(x.Name, "Ukrainian_CI_AS").Contains(term));
        if (categoryId.HasValue)
            dishes = dishes.Where(x => x.CategoryId == categoryId.Value);
        foreach (var ingredientId in ingredientIds?.Distinct() ?? [])
            dishes = dishes.Where(x => x.DishIngredients.Any(y => y.IngredientId == ingredientId));

        var total = await dishes.CountAsync(cancellationToken);
        var items = await dishes
            .OrderBy(x => x.Category.SortOrder)
            .ThenBy(x => x.Name)
            .ThenBy(x => x.DishId)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DishSearchItem(
                x.DishId,
                x.RestaurantId,
                x.CategoryId,
                x.Category.Name,
                x.Name,
                x.Description,
                x.Price,
                "UAH",
                x.Status,
                x.Photos.OrderBy(photo => photo.Position)
                    .Select(photo => photo.ImageUrl)
                    .FirstOrDefault()))
            .ToListAsync(cancellationToken);
        return Ok(new DishSearchPage(items, total, page, pageSize));
    }

    [HttpGet("dish-filters")]
    public async Task<ActionResult<DishFilterOptions>> GetFilters(
        int restaurantId, CancellationToken cancellationToken)
    {
        var unavailable = await CheckRestaurant(restaurantId, cancellationToken);
        if (unavailable is not null) return unavailable;

        var categories = await db.MenuCategories.AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId && x.IsActive)
            .OrderBy(x => x.SortOrder)
            .ThenBy(x => x.Name)
            .Select(x => new DishFilterOption(x.CategoryId, x.Name))
            .ToListAsync(cancellationToken);
        var ingredients = await db.Ingredients.AsNoTracking()
            .Where(x => db.DishIngredients.Any(y =>
                y.IngredientId == x.IngredientId &&
                y.Dish.RestaurantId == restaurantId &&
                y.Dish.Status != DishStatuses.Archived &&
                y.Dish.Category.IsActive))
            .OrderBy(x => x.Name)
            .Select(x => new DishFilterOption(x.IngredientId, x.Name))
            .ToListAsync(cancellationToken);
        return Ok(new DishFilterOptions(categories, ingredients));
    }

    private async Task<ActionResult?> CheckRestaurant(int restaurantId, CancellationToken cancellationToken)
    {
        var status = await db.Restaurants.AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId)
            .Select(x => x.Status)
            .SingleOrDefaultAsync(cancellationToken);
        if (status is null) return NotFound();
        if (status != RestaurantStatuses.Active)
            return StatusCode(StatusCodes.Status410Gone, new ProblemDetails
            {
                Status = StatusCodes.Status410Gone,
                Title = "Заклад наразі недоступний."
            });
        return null;
    }
}

public sealed record DishSearchItem(
    int Id,
    int RestaurantId,
    int CategoryId,
    string Category,
    string Title,
    string? Description,
    decimal Price,
    string Currency,
    string Status,
    string? ImageUrl);

public sealed record DishSearchPage(IReadOnlyList<DishSearchItem> Items, int Total, int Page, int PageSize);
public sealed record DishFilterOption(int Id, string Name);
public sealed record DishFilterOptions(
    IReadOnlyList<DishFilterOption> Categories,
    IReadOnlyList<DishFilterOption> Ingredients);
