using System.Text;
using Microsoft.EntityFrameworkCore;

namespace SmartMenu.Api.Data;

public sealed class SmartMenuDbContext(DbContextOptions<SmartMenuDbContext> options) : DbContext(options)
{
    public DbSet<AppUser> Users => Set<AppUser>();
    public DbSet<Restaurant> Restaurants => Set<Restaurant>();
    public DbSet<RestaurantAdminAssignment> RestaurantAdminAssignments => Set<RestaurantAdminAssignment>();
    public DbSet<MenuCategory> MenuCategories => Set<MenuCategory>();
    public DbSet<Dish> Dishes => Set<Dish>();
    public DbSet<DishPriceHistory> DishPriceHistory => Set<DishPriceHistory>();
    public DbSet<DishPhoto> DishPhotos => Set<DishPhoto>();
    public DbSet<Ingredient> Ingredients => Set<Ingredient>();
    public DbSet<DishIngredient> DishIngredients => Set<DishIngredient>();
    public DbSet<DishRating> DishRatings => Set<DishRating>();
    public DbSet<Review> Reviews => Set<Review>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AppUser>(entity =>
        {
            entity.HasKey(x => x.UserId);
            entity.Property(x => x.Email).HasMaxLength(320);
            entity.Property(x => x.PasswordHash).HasMaxLength(512);
            entity.Property(x => x.GoogleSubject).HasMaxLength(255);
            entity.Property(x => x.FirstName).HasMaxLength(100);
            entity.Property(x => x.LastName).HasMaxLength(100);
            entity.Property(x => x.PhoneNumber).HasMaxLength(20);
            entity.Property(x => x.AvatarUrl).HasMaxLength(2048);
            entity.Property(x => x.Role).HasMaxLength(30);
            entity.HasIndex(x => x.Email).IsUnique().HasFilter("[email] IS NOT NULL");
            entity.HasIndex(x => x.PhoneNumber).IsUnique().HasFilter("[phone_number] IS NOT NULL");
            entity.HasIndex(x => x.GoogleSubject).IsUnique().HasFilter("[google_subject] IS NOT NULL");
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_app_user_contact", "[email] IS NOT NULL OR [phone_number] IS NOT NULL");
                t.HasCheckConstraint("CK_app_user_login", "[password_hash] IS NOT NULL OR [google_subject] IS NOT NULL");
                t.HasCheckConstraint("CK_app_user_google_email", "[google_subject] IS NULL OR [email] IS NOT NULL");
                t.HasCheckConstraint("CK_app_user_name", "LEN(TRIM([first_name])) > 0 AND LEN(TRIM([last_name])) > 0");
            });
        });

        modelBuilder.Entity<Restaurant>(entity =>
        {
            entity.HasKey(x => x.RestaurantId);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Address).HasMaxLength(500);
            entity.Property(x => x.City).HasMaxLength(150);
            entity.Property(x => x.Latitude).HasPrecision(9, 6);
            entity.Property(x => x.Longitude).HasPrecision(9, 6);
            entity.Property(x => x.PhoneNumber).HasMaxLength(32);
            entity.Property(x => x.Email).HasMaxLength(320);
            entity.Property(x => x.LogoUrl).HasMaxLength(2048);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_restaurant_name_address", "LEN(TRIM([name])) > 0 AND LEN(TRIM([address])) > 0");
                t.HasCheckConstraint("CK_restaurant_coordinates", "([latitude] IS NULL AND [longitude] IS NULL) OR ([latitude] BETWEEN -90 AND 90 AND [longitude] BETWEEN -180 AND 180)");
                t.HasCheckConstraint("CK_restaurant_status", "[status] IN ('Pending', 'Active', 'Inactive')");
                t.HasCheckConstraint("CK_restaurant_hours_json", "[opening_hours_json] IS NULL OR ISJSON([opening_hours_json]) = 1");
            });
        });

        modelBuilder.Entity<RestaurantAdminAssignment>(entity =>
        {
            entity.HasKey(x => x.AssignmentId);
            entity.HasIndex(x => new { x.UserId, x.RestaurantId }).IsUnique();
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Restaurant).WithMany().HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<MenuCategory>(entity =>
        {
            entity.HasKey(x => x.CategoryId);
            entity.Property(x => x.Name).HasMaxLength(150);
            entity.HasIndex(x => new { x.RestaurantId, x.Name }).IsUnique();
            entity.HasOne(x => x.Restaurant).WithMany().HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_menu_category_name", "LEN(TRIM([name])) > 0"));
        });

        modelBuilder.Entity<Dish>(entity =>
        {
            entity.HasKey(x => x.DishId);
            entity.Property(x => x.Name).HasMaxLength(200);
            entity.Property(x => x.Price).HasPrecision(10, 2);
            entity.Property(x => x.WeightGrams).HasPrecision(8, 2);
            entity.Property(x => x.Calories).HasPrecision(8, 2);
            entity.Property(x => x.Proteins).HasPrecision(8, 2);
            entity.Property(x => x.Fats).HasPrecision(8, 2);
            entity.Property(x => x.Carbohydrates).HasPrecision(8, 2);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.HasIndex(x => new { x.RestaurantId, x.CategoryId, x.Name });
            entity.HasOne(x => x.Restaurant).WithMany().HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Category).WithMany().HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_dish_name_price", "LEN(TRIM([name])) > 0 AND [price] >= 0");
                t.HasCheckConstraint("CK_dish_nutrition", "([weight_grams] IS NULL OR [weight_grams] >= 0) AND ([calories] IS NULL OR [calories] >= 0) AND ([proteins] IS NULL OR [proteins] >= 0) AND ([fats] IS NULL OR [fats] >= 0) AND ([carbohydrates] IS NULL OR [carbohydrates] >= 0)");
                t.HasCheckConstraint("CK_dish_status", "[status] IN ('Available', 'Unavailable', 'Archived')");
            });
        });

        modelBuilder.Entity<DishPriceHistory>(entity =>
        {
            entity.HasKey(x => x.PriceHistoryId);
            entity.Property(x => x.Price).HasPrecision(10, 2);
            entity.HasIndex(x => new { x.DishId, x.ChangedAt });
            entity.HasOne(x => x.Dish).WithMany(x => x.PriceHistory).HasForeignKey(x => x.DishId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_dish_price_history_price", "[price] >= 0"));
        });

        modelBuilder.Entity<DishPhoto>(entity =>
        {
            entity.HasKey(x => x.PhotoId);
            entity.Property(x => x.ImageUrl).HasMaxLength(2048);
            entity.HasIndex(x => new { x.DishId, x.Position }).IsUnique();
            entity.HasOne(x => x.Dish).WithMany(x => x.Photos).HasForeignKey(x => x.DishId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_dish_photo_position", "[position] BETWEEN 1 AND 3"));
        });

        modelBuilder.Entity<Ingredient>(entity =>
        {
            entity.HasKey(x => x.IngredientId);
            entity.Property(x => x.Name).HasMaxLength(120);
            entity.HasIndex(x => x.Name).IsUnique();
            entity.ToTable(t => t.HasCheckConstraint("CK_ingredient_name", "LEN(TRIM([name])) > 0"));
        });

        modelBuilder.Entity<DishIngredient>(entity =>
        {
            entity.HasKey(x => x.DishIngredientId);
            entity.HasIndex(x => new { x.DishId, x.IngredientId }).IsUnique();
            entity.HasOne(x => x.Dish).WithMany(x => x.DishIngredients).HasForeignKey(x => x.DishId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Ingredient).WithMany().HasForeignKey(x => x.IngredientId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<DishRating>(entity =>
        {
            entity.HasKey(x => x.RatingId);
            entity.HasIndex(x => new { x.UserId, x.DishId }).IsUnique();
            entity.HasIndex(x => new { x.DishId, x.DeletedAt });
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Dish).WithMany().HasForeignKey(x => x.DishId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t => t.HasCheckConstraint("CK_dish_rating_value", "[value] BETWEEN 1 AND 5"));
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(x => x.ReviewId);
            entity.Property(x => x.Status).HasMaxLength(20);
            entity.HasIndex(x => new { x.DishId, x.Status, x.CreatedAt });
            entity.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Dish).WithMany().HasForeignKey(x => x.DishId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(x => x.Restaurant).WithMany().HasForeignKey(x => x.RestaurantId).OnDelete(DeleteBehavior.Restrict);
            entity.ToTable(t =>
            {
                t.HasCheckConstraint("CK_review_target", "([dish_id] IS NOT NULL AND [restaurant_id] IS NULL) OR ([dish_id] IS NULL AND [restaurant_id] IS NOT NULL)");
                t.HasCheckConstraint("CK_review_text", "LEN(TRIM([text])) > 0");
                t.HasCheckConstraint("CK_review_status", "[status] IN ('Published', 'Hidden', 'Removed')");
            });
        });

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            entityType.SetTableName(ToSnakeCase(entityType.ClrType.Name));
            foreach (var property in entityType.GetProperties())
            {
                property.SetColumnName(ToSnakeCase(property.Name));
            }
        }
    }

    private static string ToSnakeCase(string name)
    {
        var result = new StringBuilder(name.Length + 8);
        for (var index = 0; index < name.Length; index++)
        {
            if (index > 0 && char.IsUpper(name[index]) &&
                (char.IsLower(name[index - 1]) || char.IsDigit(name[index - 1])))
            {
                result.Append('_');
            }
            result.Append(char.ToLowerInvariant(name[index]));
        }
        return result.ToString();
    }
}
