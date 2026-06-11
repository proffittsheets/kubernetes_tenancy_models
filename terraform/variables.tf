variable "aws_region" {
  description = "AWS region for the S3 bucket (CloudFront is always global)"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "S3 bucket name for the static site — must be globally unique"
  type        = string
}

variable "project_name" {
  description = "Used for resource tagging and naming"
  type        = string
  default     = "k8s-tenancy-models"
}
