# Infrastructure

AWS infrastructure for the Kubernetes Tenancy Models site, managed with Terraform.

**What's provisioned:**
- S3 bucket (private, no public access)
- CloudFront distribution (HTTPS, serves from S3 via Origin Access Control)
- Bucket policy allowing only this CloudFront distribution to read from S3

---

## What is and isn't in git

This repo is public. Nothing in the committed files contains credentials, account IDs, bucket names, or any value specific to your AWS account.

### Committed (safe to be public)

| File | What it contains |
|------|-----------------|
| `versions.tf` | Terraform version constraints and provider requirements |
| `variables.tf` | Variable *declarations* — names and types only, no values |
| `main.tf` | All resource definitions; account ID is pulled at runtime via `data.aws_caller_identity` |
| `outputs.tf` | Output definitions — site URL, bucket name, distribution ID |
| `backend.hcl.example` | Template showing the shape of the backend config |
| `terraform.tfvars.example` | Template showing which variables need values |
| `deploy.sh` | Script to sync files to S3 and invalidate the CloudFront cache |

### Gitignored (never committed)

| File/pattern | Why |
|-------------|-----|
| `backend.hcl` | Contains your state bucket name, region, and lock settings |
| `*.tfvars` | Contains your site bucket name and other config |
| `**/.terraform/` | Provider binaries downloaded on init |
| `**/.terraform.lock.hcl` | Lock file generated on init |
| `*.tfstate`, `*.tfstate.*` | State files — stored remotely in S3, never locally |

---

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.10
- [AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) configured with credentials (`aws configure` or environment variables)
- An AWS account with permissions to create S3, CloudFront, and IAM resources

Terraform uses the standard AWS credential chain — it picks up `~/.aws/credentials`, `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` env vars, or an IAM role automatically. No credentials go in any file.

---

## One-time bootstrap

Terraform stores its state in S3, using S3's native conditional writes for locking (requires Terraform >= 1.10 — no DynamoDB table needed). The bucket must exist before you can run `terraform init`. Create it once manually:

```bash
# Create the state bucket (pick any unique name)
aws s3api create-bucket \
  --bucket your-tf-state-bucket \
  --region us-east-1

# Enable versioning so you can recover from accidental state corruption
aws s3api put-bucket-versioning \
  --bucket your-tf-state-bucket \
  --versioning-configuration Status=Enabled
```

---

## First-time setup

1. **Create your backend config** (gitignored):
   ```bash
   cp backend.hcl.example backend.hcl
   # Edit backend.hcl with your state bucket name
   ```

2. **Create your variable values** (gitignored):
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   # Edit terraform.tfvars with your site bucket name
   ```

3. **Initialise Terraform:**
   ```bash
   terraform init -backend-config=backend.hcl
   ```

4. **Preview what will be created:**
   ```bash
   terraform plan
   ```

5. **Apply:**
   ```bash
   terraform apply
   ```

After apply, Terraform prints the CloudFront URL for the site.

---

## Deploying the site

After infrastructure exists, deploy by syncing files to S3 and invalidating the CloudFront cache:

```bash
cd terraform
./deploy.sh
```

The script reads the bucket name and distribution ID from Terraform outputs — no hardcoded values. A CloudFront invalidation typically propagates within 1–2 minutes.

---

## Day-to-day workflow

```bash
# See what would change
terraform plan

# Apply changes
terraform apply

# Tear everything down (destructive — deletes the bucket and distribution)
terraform destroy
```

> **Note:** `terraform destroy` will delete the S3 bucket and all files in it. The CloudFront distribution deletion can take 10–15 minutes to complete.
