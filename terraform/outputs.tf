output "site_url" {
  description = "CloudFront URL for the site"
  value       = "https://${aws_cloudfront_distribution.site.domain_name}"
}

output "bucket_name" {
  description = "S3 bucket name (used by deploy script)"
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (used by deploy script for cache invalidation)"
  value       = aws_cloudfront_distribution.site.id
}
