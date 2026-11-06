using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartMenu.Api.Data;
using SmartMenu.Api.Security;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var errors = context.ModelState
            .Where(x => x.Value?.Errors.Count > 0)
            .ToDictionary(
                x => x.Key,
                x => x.Value!.Errors.Select(error =>
                    error.ErrorMessage.Any(character => character is >= '\u0400' and <= '\u04FF')
                        ? error.ErrorMessage
                        : "Некоректне значення.").ToArray());
        return new BadRequestObjectResult(new ValidationProblemDetails(errors)
        {
            Status = StatusCodes.Status400BadRequest,
            Title = "Некоректні дані запиту."
        });
    };
});
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<SmartMenuDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SmartMenu")
        ?? throw new InvalidOperationException("ConnectionStrings:SmartMenu is required.")));
builder.Services.AddScoped<IPasswordHasher<AppUser>, PasswordHasher<AppUser>>();
builder.Services.AddScoped<JwtTokenService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.IncludeErrorDetails = false;
        options.MapInboundClaims = false;
        var key = builder.Configuration["Jwt:Key"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key is not null && Encoding.UTF8.GetByteCount(key) >= 32
                ? new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                : null,
            ValidateIssuer = true,
            ValidIssuer = JwtTokenService.Issuer,
            ValidateAudience = true,
            ValidAudience = JwtTokenService.Audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1),
            NameClaimType = "sub",
            RoleClaimType = "role"
        };
        options.Events = new JwtBearerEvents
        {
            OnTokenValidated = async context =>
            {
                var id = context.Principal?.FindFirstValue("sub");
                var role = context.Principal?.FindFirstValue("role");
                if (!int.TryParse(id, out var userId) || role is null)
                {
                    context.Fail("Invalid account claims.");
                    return;
                }

                var db = context.HttpContext.RequestServices.GetRequiredService<SmartMenuDbContext>();
                var user = await db.Users.AsNoTracking()
                    .Where(x => x.UserId == userId)
                    .Select(x => new { x.Role, x.IsActive })
                    .SingleOrDefaultAsync(context.HttpContext.RequestAborted);
                if (user is null || !user.IsActive || user.Role != role)
                {
                    context.Fail("Account access has changed.");
                    return;
                }

                if (role == AppRoles.RestaurantAdmin &&
                    !await db.RestaurantAdminAssignments.AsNoTracking()
                        .AnyAsync(x => x.UserId == userId, context.HttpContext.RequestAborted))
                {
                    context.Fail("Restaurant access has changed.");
                }
            }
        };
    });
builder.Services.AddAuthorization();

var webOrigins = builder.Configuration["Cors:AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];
if (builder.Environment.IsDevelopment())
{
    webOrigins = [.. webOrigins, "http://localhost:5173", "http://127.0.0.1:5173"];
}
builder.Services.AddCors(options => options.AddPolicy("WebDashboard", policy =>
    policy.WithOrigins(webOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();
await AdminBootstrap.InitializeAsync(app.Services, app.Configuration);

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.UseSwaggerUI(options =>
        options.SwaggerEndpoint("/openapi/v1.json", "SmartMenu API v1"));
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseCors("WebDashboard");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
