using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.RestaurantAdmin)]
[Route("admin/restaurants/{restaurantId:int}/categories")]
public sealed class MenuCategoriesController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<MenuCategoryResponse>>> GetAll(
        int restaurantId, [FromQuery] bool includeInactive,
        CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var query = db.MenuCategories.AsNoTracking()
            .Where(x => x.RestaurantId == restaurantId);
        if (!includeInactive) query = query.Where(x => x.IsActive);

        var categories = await query.OrderBy(x => x.SortOrder)
            .ThenBy(x => x.CategoryId)
            .Select(x => new MenuCategoryResponse(
                x.CategoryId, x.RestaurantId, x.Name, x.Description,
                x.SortOrder, x.IsActive))
            .ToListAsync(cancellationToken);
        return Ok(categories);
    }

    [HttpPost]
    public async Task<ActionResult<MenuCategoryResponse>> Create(
        int restaurantId, MenuCategoryWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var name = request.Name.Trim();
        if (await db.MenuCategories.AnyAsync(x =>
                x.RestaurantId == restaurantId && x.Name == name, cancellationToken))
            return NameConflict();

        var lastOrder = await db.MenuCategories
            .Where(x => x.RestaurantId == restaurantId)
            .MaxAsync(x => (int?)x.SortOrder, cancellationToken) ?? 0;
        var now = DateTime.UtcNow;
        var category = new MenuCategory
        {
            RestaurantId = restaurantId,
            Name = name,
            Description = TrimOrNull(request.Description),
            SortOrder = lastOrder + 1,
            IsActive = true,
            CreatedAt = now,
            UpdatedAt = now
        };
        db.MenuCategories.Add(category);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return NameConflict();
        }

        return StatusCode(StatusCodes.Status201Created,
            MenuCategoryResponse.From(category));
    }

    [HttpPut("{categoryId:int}")]
    public async Task<ActionResult<MenuCategoryResponse>> Update(
        int restaurantId, int categoryId, MenuCategoryWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var category = await db.MenuCategories.SingleOrDefaultAsync(x =>
            x.CategoryId == categoryId && x.RestaurantId == restaurantId,
            cancellationToken);
        if (category is null) return NotFound();
        if (!category.IsActive) return Conflict(new ProblemDetails
        {
            Status = StatusCodes.Status409Conflict,
            Title = "Неактивну категорію не можна змінювати."
        });

        var name = request.Name.Trim();
        if (await db.MenuCategories.AnyAsync(x =>
                x.RestaurantId == restaurantId && x.CategoryId != categoryId &&
                x.Name == name, cancellationToken))
            return NameConflict();

        category.Name = name;
        category.Description = TrimOrNull(request.Description);
        category.UpdatedAt = DateTime.UtcNow;
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return NameConflict();
        }
        return Ok(MenuCategoryResponse.From(category));
    }

    [HttpPut("order")]
    public async Task<ActionResult<IReadOnlyList<MenuCategoryResponse>>> Reorder(
        int restaurantId, CategoryOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var categories = await db.MenuCategories
            .Where(x => x.RestaurantId == restaurantId && x.IsActive)
            .ToListAsync(cancellationToken);
        var ids = request.CategoryIds;
        if (ids is null || ids.Length != categories.Count ||
            ids.Distinct().Count() != ids.Length ||
            !ids.ToHashSet().SetEquals(categories.Select(x => x.CategoryId)))
            return BadRequest(new ProblemDetails
            {
                Status = StatusCodes.Status400BadRequest,
                Title = "Передайте всі активні категорії закладу рівно по одному разу."
            });

        var byId = categories.ToDictionary(x => x.CategoryId);
        var now = DateTime.UtcNow;
        for (var index = 0; index < ids.Length; index++)
        {
            var category = byId[ids[index]];
            if (category.SortOrder == index + 1) continue;
            category.SortOrder = index + 1;
            category.UpdatedAt = now;
        }
        await db.SaveChangesAsync(cancellationToken);
        return Ok(ids.Select(id => MenuCategoryResponse.From(byId[id])).ToArray());
    }

    [HttpDelete("{categoryId:int}")]
    public async Task<IActionResult> Delete(
        int restaurantId, int categoryId, CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var category = await db.MenuCategories.SingleOrDefaultAsync(x =>
            x.CategoryId == categoryId && x.RestaurantId == restaurantId,
            cancellationToken);
        if (category is null) return NotFound();
        if (await db.Dishes.AnyAsync(x => x.CategoryId == categoryId,
                cancellationToken))
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Категорію зі стравами видалити не можна."
            });

        db.MenuCategories.Remove(category);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 547 })
        {
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Категорію зі стравами видалити не можна."
            });
        }
        return NoContent();
    }

    private Task<bool> CanManage(int restaurantId, CancellationToken cancellationToken) =>
        RestaurantAdminAccess.CanManageAsync(db, User, restaurantId, cancellationToken);

    private ConflictObjectResult NameConflict() => Conflict(new ProblemDetails
    {
        Status = StatusCodes.Status409Conflict,
        Title = "Категорія з такою назвою вже існує."
    });

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is SqlException { Number: 2601 or 2627 };

    private static string? TrimOrNull(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed class MenuCategoryWriteRequest : IValidatableObject
{
    [Required(ErrorMessage = "Вкажіть назву категорії.")]
    [StringLength(150, ErrorMessage = "Назва категорії не може перевищувати 150 символів.")]
    public string Name { get; set; } = "";

    [StringLength(2000, ErrorMessage = "Опис не може перевищувати 2000 символів.")]
    public string? Description { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name))
            yield return new ValidationResult("Вкажіть назву категорії.", [nameof(Name)]);
    }
}

public sealed class CategoryOrderRequest
{
    [Required(ErrorMessage = "Вкажіть порядок категорій.")]
    public int[]? CategoryIds { get; set; }
}

public sealed record MenuCategoryResponse(
    int Id, int RestaurantId, string Name, string? Description,
    int SortOrder, bool IsActive)
{
    public static MenuCategoryResponse From(MenuCategory category) => new(
        category.CategoryId, category.RestaurantId, category.Name,
        category.Description, category.SortOrder, category.IsActive);
}
