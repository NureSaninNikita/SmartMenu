using System.Text.RegularExpressions;
using Amazon.S3;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;
using SmartMenu.Api.Storage;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.RestaurantAdmin)]
[Route("admin/restaurants/{restaurantId:int}/dishes/{dishId:int}/photos")]
public sealed class DishPhotosController(
    SmartMenuDbContext db, PhotoStorage storage,
    ILogger<DishPhotosController> logger) : ControllerBase
{
    private const int MaxPhotoBytes = 5 * 1024 * 1024;

    [HttpPut("{position:int}")]
    [Consumes("multipart/form-data")]
    [RequestSizeLimit(MaxPhotoBytes + 262144)]
    public async Task<ActionResult<DishPhotoResponse>> Upload(
        int restaurantId, int dishId, int position, [FromForm] IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (!await RestaurantAdminAccess.CanManageAsync(
                db, User, restaurantId, cancellationToken)) return Forbid();
        if (position is < 1 or > 3 || file is null ||
            file.Length is < 1 or > MaxPhotoBytes)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Оберіть фото до 5 МБ для позиції від 1 до 3."
            });
        if (!storage.IsConfigured) return StorageUnavailable();

        var dish = await db.Dishes.Include(x => x.Photos)
            .SingleOrDefaultAsync(x => x.DishId == dishId &&
                x.RestaurantId == restaurantId, cancellationToken);
        if (dish is null) return NotFound();
        if (dish.Status == DishStatuses.Archived)
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "До архівної страви не можна додавати фото."
            });

        using var content = new MemoryStream();
        await using (var input = file.OpenReadStream())
            await input.CopyToAsync(content, cancellationToken);
        if (content.Length is < 1 or > MaxPhotoBytes)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Розмір фото має бути від 1 байта до 5 МБ."
            });
        var format = DetectFormat(content.GetBuffer().AsSpan(0, (int)content.Length));
        if (format is null)
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Підтримуються лише фото JPEG, PNG або WebP."
            });

        var existing = dish.Photos.SingleOrDefault(x => x.Position == position);
        var oldKey = existing is null ? null :
            PhotoStorage.KeyFromPublicPath(existing.ImageUrl);
        var fileName = Guid.NewGuid().ToString("N") + format.Value.Extension;
        var key = $"dishes/{dishId}/{fileName}";
        content.Position = 0;
        try
        {
            await storage.PutAsync(key, content, format.Value.ContentType,
                cancellationToken);
        }
        catch (AmazonS3Exception exception)
        {
            logger.LogError(exception, "Dish photo upload failed for dish {DishId}", dishId);
            return StorageFailed();
        }

        var photo = existing ?? new DishPhoto
        {
            DishId = dishId,
            Position = position,
            ImageUrl = PhotoStorage.PublicPath(key)
        };
        photo.ImageUrl = PhotoStorage.PublicPath(key);
        if (existing is null) db.DishPhotos.Add(photo);
        dish.UpdatedAt = DateTime.UtcNow;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            await TryDeleteObject(key, cancellationToken);
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Позиція фото вже зайнята. Повторіть запит."
            });
        }
        catch
        {
            await TryDeleteObject(key, cancellationToken);
            throw;
        }

        if (oldKey is not null) await TryDeleteObject(oldKey, cancellationToken);
        return Ok(new DishPhotoResponse(photo.PhotoId, photo.ImageUrl, photo.Position));
    }

    [HttpDelete("{position:int}")]
    public async Task<IActionResult> Delete(
        int restaurantId, int dishId, int position,
        CancellationToken cancellationToken)
    {
        if (!await RestaurantAdminAccess.CanManageAsync(
                db, User, restaurantId, cancellationToken)) return Forbid();
        if (position is < 1 or > 3) return NotFound();

        var photo = await db.DishPhotos
            .Include(x => x.Dish)
            .SingleOrDefaultAsync(x => x.DishId == dishId &&
                x.Dish.RestaurantId == restaurantId && x.Position == position,
                cancellationToken);
        if (photo is null) return NotFound();
        var key = PhotoStorage.KeyFromPublicPath(photo.ImageUrl);
        if (key is not null && !storage.IsConfigured) return StorageUnavailable();

        db.DishPhotos.Remove(photo);
        photo.Dish.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        if (key is not null) await TryDeleteObject(key, cancellationToken);
        return NoContent();
    }

    private async Task TryDeleteObject(string key, CancellationToken cancellationToken)
    {
        try
        {
            await storage.DeleteAsync(key, cancellationToken);
        }
        catch (AmazonS3Exception exception)
        {
            logger.LogWarning(exception, "Could not remove photo object {Key}", key);
        }
    }

    private ObjectResult StorageUnavailable() => StatusCode(
        StatusCodes.Status503ServiceUnavailable, new ProblemDetails
        {
            Status = StatusCodes.Status503ServiceUnavailable,
            Title = "Сховище фото наразі не налаштоване."
        });

    private ObjectResult StorageFailed() => StatusCode(
        StatusCodes.Status502BadGateway, new ProblemDetails
        {
            Status = StatusCodes.Status502BadGateway,
            Title = "Не вдалося зберегти фото. Спробуйте пізніше."
        });

    private static (string Extension, string ContentType)? DetectFormat(
        ReadOnlySpan<byte> bytes)
    {
        if (bytes.Length >= 3 && bytes[0] == 0xFF && bytes[1] == 0xD8 &&
            bytes[2] == 0xFF)
            return (".jpg", "image/jpeg");
        if (bytes.Length >= 8 && bytes[..8].SequenceEqual(
                new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }))
            return (".png", "image/png");
        if (bytes.Length >= 12 && bytes[..4].SequenceEqual("RIFF"u8) &&
            bytes[8..12].SequenceEqual("WEBP"u8))
            return (".webp", "image/webp");
        return null;
    }
}

[ApiController]
[Route("media/dishes/{dishId:int}/{fileName}")]
public sealed class DishMediaController(SmartMenuDbContext db, PhotoStorage storage) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get(
        int dishId, string fileName, CancellationToken cancellationToken)
    {
        if (!Regex.IsMatch(fileName,
                "^[0-9a-f]{32}\\.(jpg|png|webp)$", RegexOptions.CultureInvariant))
            return NotFound();

        var key = $"dishes/{dishId}/{fileName}";
        var path = PhotoStorage.PublicPath(key);
        var exists = await db.DishPhotos.AsNoTracking().AnyAsync(x =>
            x.DishId == dishId && x.ImageUrl == path &&
            x.Dish.Status != DishStatuses.Archived &&
            x.Dish.Restaurant.Status == RestaurantStatuses.Active &&
            x.Dish.Category.IsActive, cancellationToken);
        if (!exists) return NotFound();
        if (!storage.IsConfigured)
            return StatusCode(StatusCodes.Status503ServiceUnavailable,
                new ProblemDetails
                {
                    Status = StatusCodes.Status503ServiceUnavailable,
                    Title = "Фото наразі недоступне."
                });

        Response.Headers.CacheControl = "public, max-age=300";
        return Redirect(await storage.GetReadUrlAsync(key));
    }
}
