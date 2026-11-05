using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("dishes")]
public sealed class DishController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet("{id:int}")]
    [ProducesResponseType<DishDetailsResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DishDetailsResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var dish = await db.Dishes.AsNoTracking().AsSplitQuery()
            .Include(x => x.Restaurant)
            .Include(x => x.Category)
            .Include(x => x.Photos)
            .Include(x => x.DishIngredients).ThenInclude(x => x.Ingredient)
            .SingleOrDefaultAsync(x => x.DishId == id &&
                x.Status != DishStatuses.Archived &&
                x.Restaurant.Status == RestaurantStatuses.Active,
                cancellationToken);

        if (dish is null)
        {
            return NotFound(new ProblemDetails
            {
                Status = StatusCodes.Status404NotFound,
                Title = "Страву не знайдено в актуальному меню."
            });
        }

        var rating = await db.DishRatings.AsNoTracking()
            .Where(x => x.DishId == id && x.DeletedAt == null)
            .GroupBy(x => x.DishId)
            .Select(group => new
            {
                Count = group.Count(),
                Average = group.Average(x => (decimal)x.Value)
            })
            .SingleOrDefaultAsync(cancellationToken);

        var reviews = await db.Reviews.AsNoTracking()
            .Where(x => x.DishId == id && x.Status == ReviewStatuses.Published)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.ReviewId)
            .Select(x => new ReviewResponse(
                x.ReviewId,
                x.UserId,
                x.User.FirstName + " " + x.User.LastName,
                x.Text,
                x.CreatedAt,
                null))
            .ToListAsync(cancellationToken);

        if (reviews.Count > 0)
        {
            var authorIds = reviews.Select(x => x.UserId).Distinct().ToArray();
            var authorRatings = await db.DishRatings.AsNoTracking()
                .Where(x => x.DishId == id && x.DeletedAt == null && authorIds.Contains(x.UserId))
                .ToDictionaryAsync(x => x.UserId, x => x.Value, cancellationToken);
            reviews = reviews.Select(x => x with
            {
                Rating = authorRatings.GetValueOrDefault(x.UserId, 0) is var value && value > 0
                    ? value
                    : null
            }).ToList();
        }

        var photos = dish.Photos.OrderBy(x => x.Position).Select(x => x.ImageUrl).ToArray();
        return Ok(new DishDetailsResponse(
            dish.DishId,
            dish.RestaurantId,
            dish.Restaurant.Name,
            dish.Category.Name,
            dish.Name,
            dish.Description,
            dish.Price,
            "UAH",
            dish.WeightGrams,
            dish.Calories,
            dish.Proteins,
            dish.Fats,
            dish.Carbohydrates,
            dish.Status,
            photos.FirstOrDefault(),
            photos,
            dish.DishIngredients.Select(x => x.Ingredient.Name).OrderBy(x => x).ToArray(),
            rating is null ? null : Math.Round(rating.Average, 2),
            rating?.Count ?? 0,
            reviews));
    }
}

public sealed record DishDetailsResponse(
    int Id,
    int RestaurantId,
    string RestaurantName,
    string Category,
    string Title,
    string? Description,
    decimal Price,
    string Currency,
    decimal? Weight,
    decimal? Calories,
    decimal? Proteins,
    decimal? Fats,
    decimal? Carbohydrates,
    string Status,
    string? ImageUrl,
    IReadOnlyList<string> Photos,
    IReadOnlyList<string> Ingredients,
    decimal? AverageRating,
    int RatingCount,
    IReadOnlyList<ReviewResponse> Reviews);

public sealed record ReviewResponse(
    int Id,
    int UserId,
    string AuthorName,
    string Text,
    DateTime CreatedAt,
    int? Rating);
