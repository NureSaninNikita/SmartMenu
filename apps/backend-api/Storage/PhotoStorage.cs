using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;

namespace SmartMenu.Api.Storage;

public sealed class PhotoStorage : IDisposable
{
    private readonly AmazonS3Client? client;
    private readonly string? bucketName;

    public bool IsConfigured => client is not null;

    public PhotoStorage(IConfiguration configuration)
    {
        var endpoint = configuration["AWS_ENDPOINT_URL"];
        var bucket = configuration["AWS_S3_BUCKET_NAME"];
        var accessKey = configuration["AWS_ACCESS_KEY_ID"];
        var secretKey = configuration["AWS_SECRET_ACCESS_KEY"];
        if (string.IsNullOrWhiteSpace(endpoint) || string.IsNullOrWhiteSpace(bucket) ||
            string.IsNullOrWhiteSpace(accessKey) || string.IsNullOrWhiteSpace(secretKey))
            return;

        var region = configuration["AWS_DEFAULT_REGION"] ?? "auto";
        var config = new AmazonS3Config
        {
            ServiceURL = endpoint,
            AuthenticationRegion = region,
            ForcePathStyle = string.Equals(configuration["AWS_S3_URL_STYLE"],
                "path", StringComparison.OrdinalIgnoreCase)
        };
        bucketName = bucket;
        client = new AmazonS3Client(
            new BasicAWSCredentials(accessKey, secretKey), config);
    }

    public async Task PutAsync(
        string key, Stream content, string contentType,
        CancellationToken cancellationToken)
    {
        EnsureConfigured();
        var request = new PutObjectRequest
        {
            BucketName = bucketName,
            Key = key,
            InputStream = content,
            ContentType = contentType,
            AutoCloseStream = false
        };
        await client!.PutObjectAsync(request, cancellationToken);
    }

    public async Task<string> GetReadUrlAsync(string key)
    {
        EnsureConfigured();
        return await client!.GetPreSignedURLAsync(new GetPreSignedUrlRequest
        {
            BucketName = bucketName,
            Key = key,
            Expires = DateTime.UtcNow.AddHours(1),
            Verb = HttpVerb.GET
        });
    }

    public Task DeleteAsync(string key, CancellationToken cancellationToken)
    {
        EnsureConfigured();
        return client!.DeleteObjectAsync(bucketName, key, cancellationToken);
    }

    public static string PublicPath(string key) => "/media/" + key;

    public static string? KeyFromPublicPath(string path) =>
        path.StartsWith("/media/dishes/", StringComparison.Ordinal)
            ? path["/media/".Length..]
            : null;

    private void EnsureConfigured()
    {
        if (!IsConfigured)
            throw new InvalidOperationException("Photo storage is not configured.");
    }

    public void Dispose() => client?.Dispose();
}
