#!/usr/bin/env bash
set -euo pipefail

BUCKET=$(terraform output -raw bucket_name)
DISTRIBUTION=$(terraform output -raw cloudfront_distribution_id)
SITE_ROOT="$(dirname "$0")/.."

echo "Syncing to s3://$BUCKET ..."
aws s3 sync "$SITE_ROOT" "s3://$BUCKET" \
  --exclude ".git/*" \
  --exclude "terraform/*" \
  --exclude ".gitignore" \
  --exclude ".DS_Store" \
  --exclude "AGENTS.md" \
  --exclude "README.md" \
  --exclude "LICENSE" \
  --delete

echo "Invalidating CloudFront cache ..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION" \
  --paths "/*" \
  --query "Invalidation.Id" \
  --output text

echo "Done — $(terraform output -raw site_url)"
