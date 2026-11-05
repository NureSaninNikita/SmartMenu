using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartMenu.Api.Data;

namespace SmartMenu.Api.Controllers;

[ApiController]
[Route("restaurants")]
public sealed class RestaurantsController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RestaurantResponse>>> GetAll(
        [FromQuery] string? city,
        CancellationToken cancellationToken)
    {
        var query = db.Restaurants.AsNoTracking()
            .Where(x => x.Status == RestaurantStatuses.Active);
        if (!string.IsNullOrWhiteSpace(city))
        {
            var selectedCity = city.Trim();
            query = query.Where(x => x.City == selectedCity);
        }

        var restaurants = await query.OrderBy(x => x.Name)
            .Select(x => new RestaurantResponse(
                x.RestaurantId, x.Name, x.Description, x.Address, x.City,
                x.Latitude, x.Longitude, x.PhoneNumber, x.Email,
                x.OpeningHoursJson, x.LogoUrl, x.Status,
                "/restaurants/" + x.RestaurantId))
            .ToListAsync(cancellationToken);
        return Ok(restaurants);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RestaurantResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        var restaurant = await db.Restaurants.AsNoTracking()
            .SingleOrDefaultAsync(x => x.RestaurantId == id, cancellationToken);
        if (restaurant is null)
        {
            return NotFound();
        }
        if (restaurant.Status != RestaurantStatuses.Active)
        {
            return StatusCode(StatusCodes.Status410Gone, new ProblemDetails
            {
                Status = StatusCodes.Status410Gone,
                Title = "Заклад наразі недоступний."
            });
        }
        return Ok(RestaurantResponse.From(restaurant));
    }
}

[ApiController]
[Authorize(Roles = "SystemAdmin")]
[Route("admin/restaurants")]
public sealed class AdminRestaurantsController(SmartMenuDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<RestaurantResponse>>> GetAll(CancellationToken cancellationToken)
    {
        if (!await IsActiveSystemAdmin(cancellationToken)) return Forbid();
        var restaurants = await db.Restaurants.AsNoTracking().OrderBy(x => x.Name)
            .Select(x => new RestaurantResponse(
                x.RestaurantId, x.Name, x.Description, x.Address, x.City,
                x.Latitude, x.Longitude, x.PhoneNumber, x.Email,
                x.OpeningHoursJson, x.LogoUrl, x.Status,
                "/restaurants/" + x.RestaurantId))
            .ToListAsync(cancellationToken);
        return Ok(restaurants);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<RestaurantResponse>> GetById(int id, CancellationToken cancellationToken)
    {
        if (!await IsActiveSystemAdmin(cancellationToken)) return Forbid();
        var restaurant = await db.Restaurants.AsNoTracking()
            .SingleOrDefaultAsync(x => x.RestaurantId == id, cancellationToken);
        return restaurant is null ? NotFound() : Ok(RestaurantResponse.From(restaurant));
    }

    [HttpPost]
    public async Task<ActionResult<RestaurantResponse>> Create(
        RestaurantWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsActiveSystemAdmin(cancellationToken)) return Forbid();
        var now = DateTime.UtcNow;
        var restaurant = new Restaurant
        {
            Name = request.Name.Trim(),
            Address = request.Address.Trim(),
            Status = RestaurantStatuses.Pending,
            CreatedAt = now,
            UpdatedAt = now
        };
        request.ApplyTo(restaurant);
        db.Restaurants.Add(restaurant);
        await db.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = restaurant.RestaurantId },
            RestaurantResponse.From(restaurant));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RestaurantResponse>> Update(
        int id,
        RestaurantWriteRequest request,
        CancellationToken cancellationToken)
    {
        if (!await IsActiveSystemAdmin(cancellationToken)) return Forbid();
        var restaurant = await db.Restaurants.SingleOrDefaultAsync(x => x.RestaurantId == id, cancellationToken);
        if (restaurant is null) return NotFound();
        request.ApplyTo(restaurant);
        restaurant.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(cancellationToken);
        return Ok(RestaurantResponse.From(restaurant));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Deactivate(int id, CancellationToken cancellationToken)
    {
        if (!await IsActiveSystemAdmin(cancellationToken)) return Forbid();
        var restaurant = await db.Restaurants.SingleOrDefaultAsync(x => x.RestaurantId == id, cancellationToken);
        if (restaurant is null) return NotFound();
        if (restaurant.Status != RestaurantStatuses.Inactive)
        {
            restaurant.Status = RestaurantStatuses.Inactive;
            restaurant.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }
        return NoContent();
    }

    private async Task<bool> IsActiveSystemAdmin(CancellationToken cancellationToken)
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return int.TryParse(claim, out var userId) &&
            await db.Users.AsNoTracking().AnyAsync(x => x.UserId == userId &&
                x.Role == "SystemAdmin" && x.IsActive, cancellationToken);
    }
}

public sealed class RestaurantWriteRequest : IValidatableObject
{
    [Required(ErrorMessage = "Назва обов'язкова.")]
    [StringLength(200, ErrorMessage = "Назва не може перевищувати 200 символів.")]
    public string Name { get; set; } = "";

    [StringLength(5000, ErrorMessage = "Опис не може перевищувати 5000 символів.")]
    public string? Description { get; set; }

    [Required(ErrorMessage = "Адреса обов'язкова.")]
    [StringLength(500, ErrorMessage = "Адреса не може перевищувати 500 символів.")]
    public string Address { get; set; } = "";

    [StringLength(150, ErrorMessage = "Назва міста не може перевищувати 150 символів.")]
    public string? City { get; set; }

    [Range(-90, 90, ErrorMessage = "Широта має бути в межах від -90 до 90.")]
    public decimal? Latitude { get; set; }

    [Range(-180, 180, ErrorMessage = "Довгота має бути в межах від -180 до 180.")]
    public decimal? Longitude { get; set; }

    [RegularExpression(@"^\+?[0-9()\- ]{7,32}$", ErrorMessage = "Неправильний формат номера телефону.")]
    public string? PhoneNumber { get; set; }

    [EmailAddress(ErrorMessage = "Неправильний формат email.")]
    [StringLength(320, ErrorMessage = "Email не може перевищувати 320 символів.")]
    public string? Email { get; set; }

    public string? OpeningHoursJson { get; set; }

    [Url(ErrorMessage = "Неправильний формат URL логотипа.")]
    [StringLength(2048, ErrorMessage = "URL логотипа не може перевищувати 2048 символів.")]
    public string? LogoUrl { get; set; }

    public string? Status { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        var errors = new List<ValidationResult>();
        if (string.IsNullOrWhiteSpace(Name))
            errors.Add(new ValidationResult("Назва обов'язкова.", [nameof(Name)]));
        if (string.IsNullOrWhiteSpace(Address))
            errors.Add(new ValidationResult("Адреса обов'язкова.", [nameof(Address)]));
        if (Latitude.HasValue != Longitude.HasValue)
            errors.Add(new ValidationResult("Широту й довготу потрібно вказувати разом.",
                [nameof(Latitude), nameof(Longitude)]));
        if (Status is not null && Status is not (RestaurantStatuses.Pending or RestaurantStatuses.Active or RestaurantStatuses.Inactive))
            errors.Add(new ValidationResult("Невідомий статус закладу.", [nameof(Status)]));
        if (OpeningHoursJson is not null)
        {
            try
            {
                using var json = JsonDocument.Parse(OpeningHoursJson);
                if (json.RootElement.ValueKind != JsonValueKind.Object)
                    errors.Add(new ValidationResult("Графік роботи має бути JSON-об'єктом.", [nameof(OpeningHoursJson)]));
            }
            catch (JsonException)
            {
                errors.Add(new ValidationResult("Некоректний JSON графіка роботи.", [nameof(OpeningHoursJson)]));
            }
        }
        return errors;
    }

    public void ApplyTo(Restaurant restaurant)
    {
        restaurant.Name = Name.Trim();
        restaurant.Description = TrimOrNull(Description);
        restaurant.Address = Address.Trim();
        restaurant.City = TrimOrNull(City);
        restaurant.Latitude = Latitude;
        restaurant.Longitude = Longitude;
        restaurant.PhoneNumber = TrimOrNull(PhoneNumber);
        restaurant.Email = TrimOrNull(Email);
        restaurant.OpeningHoursJson = OpeningHoursJson;
        restaurant.LogoUrl = TrimOrNull(LogoUrl);
        if (Status is not null) restaurant.Status = Status;
    }

    private static string? TrimOrNull(string? value) => string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}

public sealed record RestaurantResponse(
    int Id,
    string Name,
    string? Description,
    string Address,
    string? City,
    decimal? Latitude,
    decimal? Longitude,
    string? PhoneNumber,
    string? Email,
    string? OpeningHoursJson,
    string? LogoUrl,
    string Status,
    string MenuUrl)
{
    public static RestaurantResponse From(Restaurant restaurant) => new(
        restaurant.RestaurantId, restaurant.Name, restaurant.Description,
        restaurant.Address, restaurant.City, restaurant.Latitude, restaurant.Longitude,
        restaurant.PhoneNumber, restaurant.Email, restaurant.OpeningHoursJson,
        restaurant.LogoUrl, restaurant.Status,
        "/restaurants/" + restaurant.RestaurantId);
}
