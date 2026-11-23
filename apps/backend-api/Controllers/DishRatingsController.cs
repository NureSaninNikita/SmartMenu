using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Authorize]
[Route("dishes/{dishId:int}/rating")]
public sealed class DishRatingsController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DishRatingResponse>> GetMine(
        int dishId, CancellationToken cancellationToken)
    {
        if (!await IsVisibleDish(dishId, cancellationToken)) return NotFound();

        var userId = int.Parse(User.FindFirstValue("sub")!);
        var value = await db.DishRatings.AsNoTracking()
            .Where(x => x.DishId == dishId && x.UserId == userId && x.DeletedAt == null)
            .Select(x => (int?)x.Value)
            .SingleOrDefaultAsync(cancellationToken);
        return Ok(await BuildResponse(dishId, value, cancellationToken));
    }

    [HttpPut]
    public async Task<ActionResult<DishRatingResponse>> SetMine(
        int dishId, DishRatingRequest request, CancellationToken cancellationToken)
    {
        if (!await IsVisibleDish(dishId, cancellationToken)) return NotFound();

        var userId = int.Parse(User.FindFirstValue("sub")!);
        var now = DateTime.UtcNow;
        var rating = await db.DishRatings.SingleOrDefaultAsync(x =>
            x.DishId == dishId && x.UserId == userId, cancellationToken);
        if (rating is null)
        {
            rating = new DishRating
            {
                DishId = dishId,
                UserId = userId,
                Value = request.Value!.Value,
                CreatedAt = now,
                UpdatedAt = now
            };
            db.DishRatings.Add(rating);
            try
            {
                await db.SaveChangesAsync(cancellationToken);
            }
            catch (DbUpdateException exception) when (
                exception.InnerException is SqlException { Number: 2601 or 2627 })
            {
                db.Entry(rating).State = EntityState.Detached;
                rating = await db.DishRatings.SingleAsync(x =>
                    x.DishId == dishId && x.UserId == userId,
                    cancellationToken);
                rating.Value = request.Value.Value;
                rating.DeletedAt = null;
                rating.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(cancellationToken);
            }
        }
        else
        {
            rating.Value = request.Value!.Value;
            rating.DeletedAt = null;
            rating.UpdatedAt = now;
            await db.SaveChangesAsync(cancellationToken);
        }

        return Ok(await BuildResponse(dishId, request.Value, cancellationToken));
    }

    private Task<bool> IsVisibleDish(int dishId, CancellationToken cancellationToken) =>
        db.Dishes.AsNoTracking().AnyAsync(x =>
            x.DishId == dishId && x.Status != DishStatuses.Archived &&
            x.Restaurant.Status == RestaurantStatuses.Active && x.Category.IsActive,
            cancellationToken);

    private async Task<DishRatingResponse> BuildResponse(
        int dishId, int? value, CancellationToken cancellationToken)
    {
        var aggregate = await db.DishRatings.AsNoTracking()
            .Where(x => x.DishId == dishId && x.DeletedAt == null)
            .GroupBy(x => x.DishId)
            .Select(group => new
            {
                Count = group.Count(),
                Average = group.Average(x => (decimal)x.Value)
            })
            .SingleOrDefaultAsync(cancellationToken);
        return new DishRatingResponse(
            dishId, value, aggregate is null ? null : Math.Round(aggregate.Average, 2),
            aggregate?.Count ?? 0);
    }
}

public sealed class DishRatingRequest
{
    [Required(ErrorMessage = "Вкажіть оцінку.")]
    [Range(1, 5, ErrorMessage = "Оцінка має бути від 1 до 5.")]
    public int? Value { get; set; }
}

public sealed record DishRatingResponse(
    int DishId, int? Value, decimal? AverageRating, int RatingCount);
