namespace SmartMenu.Api.Data;

public static class RestaurantStatuses
{
    public const string Pending = "Pending";
    public const string Active = "Active";
    public const string Inactive = "Inactive";
}

public static class DishStatuses
{
    public const string Available = "Available";
    public const string Unavailable = "Unavailable";
    public const string Archived = "Archived";
}

public static class ReviewStatuses
{
    public const string Published = "Published";
    public const string Hidden = "Hidden";
    public const string Removed = "Removed";
}

public sealed class AppUser
{
    public int UserId { get; set; }
    public string? Email { get; set; }
    public string? PasswordHash { get; set; }
    public string? GoogleSubject { get; set; }
    public required string FirstName { get; set; }
    public required string LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "RegisteredUser";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class Restaurant
{
    public int RestaurantId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public required string Address { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }
    public string? OpeningHoursJson { get; set; }
    public string? LogoUrl { get; set; }
    public string Status { get; set; } = RestaurantStatuses.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

public sealed class RestaurantAdminAssignment
{
    public int AssignmentId { get; set; }
    public DateTime CreatedAt { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
}

public sealed class MenuCategory
{
    public int CategoryId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
}

public sealed class Dish
{
    public int DishId { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public decimal Price { get; set; }
    public decimal? WeightGrams { get; set; }
    public decimal? Calories { get; set; }
    public decimal? Proteins { get; set; }
    public decimal? Fats { get; set; }
    public decimal? Carbohydrates { get; set; }
    public string Status { get; set; } = DishStatuses.Available;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int RestaurantId { get; set; }
    public Restaurant Restaurant { get; set; } = null!;
    public int CategoryId { get; set; }
    public MenuCategory Category { get; set; } = null!;
    public List<DishPhoto> Photos { get; set; } = [];
    public List<DishIngredient> DishIngredients { get; set; } = [];
    public List<DishPriceHistory> PriceHistory { get; set; } = [];
}

public sealed class DishPriceHistory
{
    public int PriceHistoryId { get; set; }
    public decimal Price { get; set; }
    public DateTime ChangedAt { get; set; }
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;
}

public sealed class DishPhoto
{
    public int PhotoId { get; set; }
    public required string ImageUrl { get; set; }
    public int Position { get; set; }
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;
}

public sealed class Ingredient
{
    public int IngredientId { get; set; }
    public required string Name { get; set; }
}

public sealed class DishIngredient
{
    public int DishIngredientId { get; set; }
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;
    public int IngredientId { get; set; }
    public Ingredient Ingredient { get; set; } = null!;
}

public sealed class DishRating
{
    public int RatingId { get; set; }
    public int Value { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public DateTime? DeletedAt { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int DishId { get; set; }
    public Dish Dish { get; set; } = null!;
}

public sealed class Review
{
    public int ReviewId { get; set; }
    public required string Text { get; set; }
    public string Status { get; set; } = ReviewStatuses.Published;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;
    public int? DishId { get; set; }
    public Dish? Dish { get; set; }
    public int? RestaurantId { get; set; }
    public Restaurant? Restaurant { get; set; }
}
