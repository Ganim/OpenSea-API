# ADR-007: Storage S3 Architecture

## Status: Accepted
## Date: 2026-01-20

## Context

The Storage module needed to support file uploads for:
- Email attachments (up to 25MB)
- Document management (folder hierarchy with access control)
- Employee photos, product images

We needed an approach that works in development (local) and production (cloud).

## Decision

Use **S3-compatible object storage** (Cloudflare R2 in production) with the AWS SDK v3.

Architecture:
- Files are stored in S3 with keys following: `{tenantId}/{folderId}/{fileId}-{filename}`
- Metadata (name, size, mimeType, folder, access rules) stored in PostgreSQL
- Uploads go through the API (multipart/form-data) — no presigned URLs yet
- Downloads use presigned GET URLs (1-hour expiry)
- Per-tenant storage quotas enforced at upload time
- AES-256-GCM encryption for sensitive files (optional, key in env)
- Folder hierarchy with inherited access rules (user/group/team)

Local development uses MinIO or falls back to local filesystem.

## Consequences

**Positive:**
- S3-compatible = vendor-agnostic (works with AWS, R2, MinIO, Backblaze)
- Metadata in PostgreSQL enables fast folder browsing and search
- Access control at folder level with inheritance reduces rule management
- Presigned URLs offload download bandwidth from the API

**Negative:**
- Upload goes through API server (no direct-to-S3 uploads yet)
- Two sources of truth (S3 for files, Postgres for metadata) require consistency management
- Folder moves require updating all descendant paths (batch operation)
- R2 doesn't support all S3 features (no lifecycle rules with prefix filters)
