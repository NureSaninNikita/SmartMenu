using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SmartMenu.Api.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddProblemDetails();
builder.Services.AddDbContext<SmartMenuDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("SmartMenu")
        ?? throw new InvalidOperationException("ConnectionStrings:SmartMenu is required.")));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"];
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = key is { Length: >= 32 }
                ? new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
                : null,
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });
builder.Services.AddAuthorization();

var webOrigins = builder.Configuration["Cors:AllowedOrigins"]?
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? [];
if (builder.Environment.IsDevelopment())
{
    webOrigins = [.. webOrigins, "http://localhost:5173"];
}
builder.Services.AddCors(options => options.AddPolicy("WebDashboard", policy =>
    policy.WithOrigins(webOrigins).AllowAnyHeader().AllowAnyMethod()));

var app = builder.Build();

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
