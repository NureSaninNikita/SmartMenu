using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("reviews")]
public sealed class ReviewsController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet("/restaurants/{restaurantId:int}/reviews")]
    public async Task<ActionResult<IReadOnlyList<ReviewResponse>>> GetRestaurantReviews(
        int restaurantId, CancellationToken cancellationToken)
    {
        var restaurant = await db.Restaurants.AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId)
            .Select(x => new { x.Status })
            .SingleOrDefaultAsync(cancellationToken);
        if (restaurant is null) return NotFound();
        if (restaurant.Status != RestaurantStatuses.Active)
            return StatusCode(StatusCodes.Status410Gone, new ProblemDetails
            {
                Status = StatusCodes.Status410Gone,
                Title = "Заклад наразі недоступний."
            });

        var reviews = await db.Reviews.AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId &&
                x.Status == ReviewStatuses.Published)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.ReviewId)
            .Select(x => new ReviewResponse(
                x.ReviewId, x.UserId, x.User.FirstName + " " + x.User.LastName,
                x.Text, x.CreatedAt, null, x.DishId, x.RestaurantId))
            .ToListAsync(cancellationToken);
        return Ok(reviews);
    }

    [Authorize]
    [HttpGet("mine")]
    public async Task<ActionResult<IReadOnlyList<ReviewResponse>>> GetMine(
        CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirstValue("sub")!);
        var reviews = await db.Reviews.AsNoTracking()
            .Where(x => x.UserId == userId && x.Status != ReviewStatuses.Removed)
            .OrderByDescending(x => x.CreatedAt)
            .ThenByDescending(x => x.ReviewId)
            .Select(x => new ReviewResponse(
                x.ReviewId, x.UserId, x.User.FirstName + " " + x.User.LastName,
                x.Text, x.CreatedAt, null, x.DishId, x.RestaurantId))
            .ToListAsync(cancellationToken);
        return Ok(reviews);
    }

    [Authorize]
    [HttpPost("/dishes/{dishId:int}/reviews")]
    public async Task<ActionResult<ReviewResponse>> CreateForDish(
        int dishId, ReviewTextRequest request, CancellationToken cancellationToken)
    {
        var exists = await db.Dishes.AsNoTracking().AnyAsync(x =>
            x.DishId == dishId && x.Status != DishStatuses.Archived &&
            x.Restaurant.Status == RestaurantStatuses.Active && x.Category.IsActive,
            cancellationToken);
        if (!exists) return NotFound();
        return await Create(request.Text.Trim(), dishId, null, cancellationToken);
    }

    [Authorize]
    [HttpPost("/restaurants/{restaurantId:int}/reviews")]
    public async Task<ActionResult<ReviewResponse>> CreateForRestaurant(
        int restaurantId, ReviewTextRequest request,
        CancellationToken cancellationToken)
    {
        var exists = await db.Restaurants.AsNoTracking().AnyAsync(x =>
            x.RestaurantId == restaurantId && x.Status == RestaurantStatuses.Active,
            cancellationToken);
        if (!exists) return NotFound();
        return await Create(request.Text.Trim(), null, restaurantId, cancellationToken);
    }

    private async Task<ActionResult<ReviewResponse>> Create(
        string text, int? dishId, int? restaurantId,
        CancellationToken cancellationToken)
    {
        var userId = int.Parse(User.FindFirstValue("sub")!);
        var user = await db.Users.AsNoTracking()
            .SingleAsync(x => x.UserId == userId, cancellationToken);
        var now = DateTime.UtcNow;
        var review = new Review
        {
            UserId = userId,
            DishId = dishId,
            RestaurantId = restaurantId,
            Text = text,
            Status = ReviewStatuses.Published,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.Reviews.Add(review);
        await db.SaveChangesAsync(cancellationToken);
        return StatusCode(StatusCodes.Status201Created,
            await ToResponse(review, user, cancellationToken));
    }

    private async Task<ReviewResponse> ToResponse(
        Review review, AppUser author, CancellationToken cancellationToken)
    {
        int? rating = null;
        if (review.DishId.HasValue)
            rating = await db.DishRatings.AsNoTracking()
                .Where(x => x.DishId == review.DishId &&
                    x.UserId == review.UserId && x.DeletedAt == null)
                .Select(x => (int?)x.Value)
                .SingleOrDefaultAsync(cancellationToken);

        return new ReviewResponse(
            review.ReviewId, review.UserId,
            author.FirstName + " " + author.LastName,
            review.Text, review.CreatedAt, rating,
            review.DishId, review.RestaurantId);
    }
}

public sealed class ReviewTextRequest : IValidatableObject
{
    [Required(ErrorMessage = "Вкажіть текст відгуку.")]
    [StringLength(2000, ErrorMessage = "Відгук не може перевищувати 2000 символів.")]
    public string Text { get; set; } = "";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Text))
            yield return new ValidationResult("Вкажіть текст відгуку.", [nameof(Text)]);
    }
}
