using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Authorize(Roles = AppRoles.RestaurantAdmin)]
[Route("admin/restaurants/{restaurantId:int}/dishes")]
public sealed class AdminDishesController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<AdminDishResponse>>> GetAll(
        int restaurantId, CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var dishes = await db.Dishes.AsNoTracking().AsSplitQuery()
            .Include(x => x.Photos)
            .Include(x => x.DishIngredients).ThenInclude(x => x.Ingredient)
            .Where(x => x.RestaurantId == restaurantId)
            .OrderBy(x => x.CategoryId)
            .ThenBy(x => x.Name)
            .ThenBy(x => x.DishId)
            .ToListAsync(cancellationToken);
        return Ok(dishes.Select(AdminDishResponse.From).ToArray());
    }

    [HttpGet("{dishId:int}")]
    public async Task<ActionResult<AdminDishResponse>> GetById(
        int restaurantId, int dishId, CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var dish = await LoadDish(restaurantId, dishId, cancellationToken);
        return dish is null ? NotFound() : Ok(AdminDishResponse.From(dish));
    }

    [HttpPost]
    public async Task<ActionResult<AdminDishResponse>> Create(
        int restaurantId, DishWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();
        if (!await IsValidCategory(restaurantId, request.CategoryId!.Value,
                cancellationToken)) return InvalidCategory();
        if (!await AreValidIngredients(request.IngredientIds, cancellationToken))
            return InvalidIngredients();

        var now = DateTime.UtcNow;
        var dish = new Dish
        {
            RestaurantId = restaurantId,
            CategoryId = request.CategoryId.Value,
            Name = request.Name.Trim(),
            Price = request.Price!.Value,
            Status = DishStatuses.Available,
            CreatedAt = now,
            UpdatedAt = now
        };
        request.ApplyTo(dish);
        foreach (var ingredientId in request.IngredientIds)
            dish.DishIngredients.Add(new DishIngredient { IngredientId = ingredientId });
        dish.PriceHistory.Add(new DishPriceHistory
        {
            Price = dish.Price,
            ChangedAt = now
        });

        db.Dishes.Add(dish);
        await db.SaveChangesAsync(cancellationToken);
        var result = await LoadDish(restaurantId, dish.DishId, cancellationToken);
        return StatusCode(StatusCodes.Status201Created,
            AdminDishResponse.From(result!));
    }

    [HttpPut("{dishId:int}")]
    public async Task<ActionResult<AdminDishResponse>> Update(
        int restaurantId, int dishId, DishWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await CanManage(restaurantId, cancellationToken)) return Forbid();

        var dish = await db.Dishes.Include(x => x.DishIngredients)
            .SingleOrDefaultAsync(x => x.DishId == dishId &&
                x.RestaurantId == restaurantId, cancellationToken);
        if (dish is null) return NotFound();
        if (dish.Status == DishStatuses.Archived)
            return Conflict(new ProblemDetails
            {
                Status = StatusCodes.Status409Conflict,
                Title = "Архівну страву не можна змінювати."
            });
        if (!await IsValidCategory(restaurantId, request.CategoryId!.Value,
                cancellationToken)) return InvalidCategory();
        if (!await AreValidIngredients(request.IngredientIds, cancellationToken))
            return InvalidIngredients();

        var now = DateTime.UtcNow;
        var oldPrice = dish.Price;
        request.ApplyTo(dish);
        dish.UpdatedAt = now;
        if (oldPrice != dish.Price)
            dish.PriceHistory.Add(new DishPriceHistory
            {
                Price = dish.Price,
                ChangedAt = now
            });

        var requestedIds = request.IngredientIds.ToHashSet();
        foreach (var link in dish.DishIngredients
                     .Where(x => !requestedIds.Contains(x.IngredientId)).ToArray())
            db.DishIngredients.Remove(link);
        var existingIds = dish.DishIngredients.Select(x => x.IngredientId).ToHashSet();
        foreach (var ingredientId in requestedIds.Except(existingIds))
            dish.DishIngredients.Add(new DishIngredient { IngredientId = ingredientId });

        await db.SaveChangesAsync(cancellationToken);
        var result = await LoadDish(restaurantId, dishId, cancellationToken);
        return Ok(AdminDishResponse.From(result!));
    }

    private Task<bool> CanManage(int restaurantId, CancellationToken cancellationToken) =>
        RestaurantAdminAccess.CanManageAsync(db, User, restaurantId, cancellationToken);

    private Task<bool> IsValidCategory(
        int restaurantId, int categoryId, CancellationToken cancellationToken) =>
        db.MenuCategories.AsNoTracking().AnyAsync(x =>
            x.CategoryId == categoryId && x.RestaurantId == restaurantId && x.IsActive,
            cancellationToken);

    private async Task<bool> AreValidIngredients(
        int[] ids, CancellationToken cancellationToken)
    {
        if (ids.Length == 0) return true;
        var count = await db.Ingredients.AsNoTracking()
            .CountAsync(x => ids.Contains(x.IngredientId), cancellationToken);
        return count == ids.Length;
    }

    private Task<Dish?> LoadDish(
        int restaurantId, int dishId, CancellationToken cancellationToken) =>
        db.Dishes.AsNoTracking().AsSplitQuery()
            .Include(x => x.Photos)
            .Include(x => x.DishIngredients).ThenInclude(x => x.Ingredient)
            .SingleOrDefaultAsync(x => x.DishId == dishId &&
                x.RestaurantId == restaurantId, cancellationToken);

    private BadRequestObjectResult InvalidCategory() => BadRequest(new ProblemDetails
    {
        Status = StatusCodes.Status400BadRequest,
        Title = "Категорія не належить закладу або неактивна."
    });

    private BadRequestObjectResult InvalidIngredients() => BadRequest(new ProblemDetails
    {
        Status = StatusCodes.Status400BadRequest,
        Title = "Один або кілька інгредієнтів не знайдено."
    });
}

public sealed class DishWriteRequest : IValidatableObject
{
    [Required(ErrorMessage = "Вкажіть категорію.")]
    [Range(1, int.MaxValue, ErrorMessage = "Некоректна категорія.")]
    public int? CategoryId { get; set; }

    [Required(ErrorMessage = "Вкажіть назву страви.")]
    [StringLength(200, ErrorMessage = "Назва страви не може перевищувати 200 символів.")]
    public string Name { get; set; } = "";

    [StringLength(5000, ErrorMessage = "Опис не може перевищувати 5000 символів.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Вкажіть ціну.")]
    [Range(typeof(decimal), "0", "99999999.99", ErrorMessage = "Некоректна ціна.")]
    public decimal? Price { get; set; }

    [Range(typeof(decimal), "0", "999999.99", ErrorMessage = "Некоректна вага.")]
    public decimal? WeightGrams { get; set; }

    [Range(typeof(decimal), "0", "999999.99", ErrorMessage = "Некоректна калорійність.")]
    public decimal? Calories { get; set; }

    [Range(typeof(decimal), "0", "999999.99", ErrorMessage = "Некоректна кількість білків.")]
    public decimal? Proteins { get; set; }

    [Range(typeof(decimal), "0", "999999.99", ErrorMessage = "Некоректна кількість жирів.")]
    public decimal? Fats { get; set; }

    [Range(typeof(decimal), "0", "999999.99", ErrorMessage = "Некоректна кількість вуглеводів.")]
    public decimal? Carbohydrates { get; set; }

    public int[] IngredientIds { get; set; } = [];

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name))
            yield return new ValidationResult("Вкажіть назву страви.", [nameof(Name)]);
        if (IngredientIds is null || IngredientIds.Length > 100 ||
            IngredientIds.Any(id => id <= 0) ||
            IngredientIds.Distinct().Count() != IngredientIds.Length)
            yield return new ValidationResult("Некоректний список інгредієнтів.",
                [nameof(IngredientIds)]);
    }

    public void ApplyTo(Dish dish)
    {
        dish.CategoryId = CategoryId!.Value;
        dish.Name = Name.Trim();
        dish.Description = string.IsNullOrWhiteSpace(Description) ? null : Description.Trim();
        dish.Price = Price!.Value;
        dish.WeightGrams = WeightGrams;
        dish.Calories = Calories;
        dish.Proteins = Proteins;
        dish.Fats = Fats;
        dish.Carbohydrates = Carbohydrates;
    }
}

public sealed record AdminDishResponse(
    int Id, int RestaurantId, int CategoryId, string Name, string? Description,
    decimal Price, decimal? WeightGrams, decimal? Calories, decimal? Proteins,
    decimal? Fats, decimal? Carbohydrates, string Status,
    IReadOnlyList<DishIngredientResponse> Ingredients,
    IReadOnlyList<DishPhotoResponse> Photos, DateTime CreatedAt, DateTime UpdatedAt)
{
    public static AdminDishResponse From(Dish dish) => new(
        dish.DishId, dish.RestaurantId, dish.CategoryId, dish.Name,
        dish.Description, dish.Price, dish.WeightGrams, dish.Calories,
        dish.Proteins, dish.Fats, dish.Carbohydrates, dish.Status,
        dish.DishIngredients.OrderBy(x => x.Ingredient.Name)
            .Select(x => new DishIngredientResponse(x.IngredientId, x.Ingredient.Name))
            .ToArray(),
        dish.Photos.OrderBy(x => x.Position)
            .Select(x => new DishPhotoResponse(x.PhotoId, x.ImageUrl, x.Position))
            .ToArray(),
        dish.CreatedAt, dish.UpdatedAt);
}

public sealed record DishIngredientResponse(int Id, string Name);
public sealed record DishPhotoResponse(int Id, string ImageUrl, int Position);
