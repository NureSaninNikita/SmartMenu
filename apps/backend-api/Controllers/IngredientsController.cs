using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("ingredients")]
public sealed class IngredientsController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<DishIngredientResponse>>> GetAll(
        CancellationToken cancellationToken)
    {
        var ingredients = await db.Ingredients.AsNoTracking()
            .OrderBy(x => x.Name)
            .Select(x => new DishIngredientResponse(x.IngredientId, x.Name))
            .ToListAsync(cancellationToken);
        return Ok(ingredients);
    }

    [Authorize(Roles = AppRoles.RestaurantAdmin)]
    [HttpPost]
    public async Task<ActionResult<DishIngredientResponse>> Create(
        IngredientWriteRequest request, CancellationToken cancellationToken)
    {
        var name = request.Name.Trim();
        var existing = await db.Ingredients.AsNoTracking()
            .SingleOrDefaultAsync(x => x.Name == name, cancellationToken);
        if (existing is not null)
            return Ok(new DishIngredientResponse(existing.IngredientId, existing.Name));

        var ingredient = new Ingredient { Name = name };
        db.Ingredients.Add(ingredient);
        try
        {
            await db.SaveChangesAsync(cancellationToken);
        }
        catch (DbUpdateException exception) when (
            exception.InnerException is SqlException { Number: 2601 or 2627 })
        {
            db.Entry(ingredient).State = EntityState.Detached;
            existing = await db.Ingredients.AsNoTracking()
                .SingleAsync(x => x.Name == name, cancellationToken);
            return Ok(new DishIngredientResponse(existing.IngredientId, existing.Name));
        }
        return StatusCode(StatusCodes.Status201Created,
            new DishIngredientResponse(ingredient.IngredientId, ingredient.Name));
    }
}

public sealed class IngredientWriteRequest : IValidatableObject
{
    [Required(ErrorMessage = "Вкажіть назву інгредієнта.")]
    [StringLength(120, ErrorMessage = "Назва інгредієнта не може перевищувати 120 символів.")]
    public string Name { get; set; } = "";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.IsNullOrWhiteSpace(Name))
            yield return new ValidationResult("Вкажіть назву інгредієнта.", [nameof(Name)]);
    }
}
