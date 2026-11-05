FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY SmartMenu.Api.csproj ./
RUN dotnet restore SmartMenu.Api.csproj

COPY . ./
RUN dotnet publish SmartMenu.Api.csproj -c Release --no-restore -o /out

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /out ./

CMD ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} exec dotnet SmartMenu.Api.dll"]
