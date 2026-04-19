# Storage / File Manager Module (Updated: Feb 2026)

## Module Summary
Full-featured file management system with S3 storage, folder hierarchy, access control, sharing, versioning, and trash.

| Layer | Count |
|-------|-------|
| Prisma models | 5 (StorageFolder, StorageFile, StorageFileVersion, FolderAccessRule, StorageShareLink) |
| Entities + VOs | 5 entities + 3 value objects (FileType, StorageFileStatus, StoragePath) |
| Use cases | 48 (20 files, 12 folders, 5 access, 5 sharing, 4 auto-creation, 1 filter, 1 migration) |
| Controllers | 42 active (including admin/migrate + upload-file-root + download-folder) |
| Repositories | 5 interfaces × 2 impls = 10 files |
| Zod schemas | 4 files |
| Mappers | 5 pairs = 10 files |
| Permission codes | 31 (7 groups) |
| Unit tests (API) | 48 files |
| E2E tests (API) | 44 files |
| Frontend components | 24 |
| Frontend hooks | 6 files (~30 hooks) |
| Frontend services | 5 |
| E2E tests (APP) | 17 Playwright files |

## Backend Architecture

### Prisma Models
- `StorageFolder` — self-referential tree, soft delete, unique `(tenantId, path, deletedAt)`
- `StorageFile` — nullable `folderId`, soft delete, `fileKey` (S3), `thumbnailKey`, `status` enum
- `StorageFileVersion` — immutable version records, cascade delete on parent
- `FolderAccessRule` — per-user or per-group ACL (canRead/Write/Delete/Share + isInherited)
- `StorageShareLink` — tokenized public links with optional password, expiry, download limit

### Use Case Groups
- `files/` (20): Upload, download, get, list, delete, restore, rename, move, preview, upload-version, restore-version, list-versions, search, stats, bulk-delete, bulk-move, archive-expired, purge-deleted, list-deleted, empty-trash
- `folders/` (12): Create, get, list-contents, breadcrumb, rename, move, update, delete, restore, search, apply-template
- `access/` (5): Set, remove, list, check, propagate-to-children
- `sharing/` (5): Create-link, revoke, list-links, access-shared, download-shared
- `auto-creation/` (4): Initialize-tenant, create-entity-folders, rename-entity-folders, create-purchase-order-folder
- `filters/` (1): Get-filter-folder-contents
- `migration/` (1): Migrate-finance-attachments (super-admin, one-time)

### Controllers (6 route groups)
- `storage/files/` — 14 controllers (CRUD, versions, bulk, search, stats)
- `storage/folders/` — 14 controllers (CRUD, breadcrumb, templates, filter, search, initialize, ensure-entity)
- `storage/access/` — 3 controllers (set, list, remove ACL rules)
- `storage/sharing/` — 3 controllers (create, list, revoke share links)
- `storage/trash/` — 4 controllers (list-deleted, restore-file, restore-folder, empty-trash)
- `storage/public/` — 2 controllers (access-shared-file, download-shared-file — NO auth)

### Services / Infrastructure
- `FileUploadService` interface → `S3FileUploadService` (prod, @aws-sdk) + `LocalFileUploadService` (dev fallback)
- `ThumbnailService` interface → `SharpThumbnailService` (images only) + `NoOpThumbnailService` (tests)
- Selection: `env.S3_ENDPOINT ? S3 : Local` in factory files
- Env vars: `S3_ENDPOINT`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_BUCKET` (default: 'opensea-attachments'), `S3_REGION` (default: 'auto')
- Constants: `folder-templates.ts` — ROOT_SYSTEM_FOLDERS (4), ENTITY_FOLDER_CONFIGS (4), FILTER_FOLDER_CONFIGS (5), USER_FOLDER_TEMPLATES (4)

### Permission Codes (31 total)
- `storage.interface.view` (1)
- `storage.user-folders.*` (8): list, create, read, update, delete, download, share-user, share-group
- `storage.filter-folders.*` (5): list, read, download, share-user, share-group
- `storage.system-folders.*` (5): list, read, download, share-user, share-group
- `storage.files.*` (8): list, create, read, update, delete, download, share-user, share-group
- `storage.versions.*` (3): read, create, restore
- `storage.stats.view` (1)

## Frontend Architecture

### Page / Routes
- Main: `/file-manager` — route group `(dashboard)/(tools)`, protected by `storage.interface.view`
- Public: `/shared/[token]` — outside dashboard, no auth, password support
- Embedded: Profile attachments-tab, HR employees/[id], HR companies/[id], Stock manufacturers/[id] — all use `<FileManager entityType="..." entityId="..." />`

### Key Components (in `src/components/storage/`)
- `file-manager.tsx` — root orchestrator, manages all dialogs/selection/navigation/DnD
- `file-manager-grid.tsx` / `file-manager-list.tsx` — view modes with DnD + rubber-band selection
- `file-manager-toolbar.tsx` — search, view toggle, sort, folder type filters
- `file-manager-breadcrumb.tsx` — navigation with DnD drop targets
- `folder-card.tsx` / `file-card.tsx` — item cards with context menus
- `file-preview-modal.tsx` — inline preview for images/PDFs
- `file-version-panel.tsx` — version history sheet
- `upload-dialog.tsx` — drag-drop upload zone with quota check
- `share-link-dialog.tsx` — create/list/revoke share links
- `folder-access-dialog.tsx` — ACL management per user/group
- `trash-view.tsx` / `empty-trash-dialog.tsx` — trash management
- `storage-stats-card.tsx` / `quota-warning-banner.tsx` — usage metrics

### Types (`src/types/storage/`)
- `file.types.ts`, `folder.types.ts`, `access.types.ts`, `share.types.ts` + barrel `index.ts`
- **Not exported from root barrel** (`src/types/index.ts`) — must import from `@/types/storage`

### Hooks (`src/hooks/storage/`)
- `use-file-manager.ts` — main state machine (navigation, selection, sorting, search)
- `use-files.ts` — ~12 hooks for file CRUD, versions, search, stats
- `use-folders.ts` — ~11 hooks for folder CRUD, breadcrumb, search, initialize
- `use-folder-access.ts` — 3 hooks for ACL management
- `use-trash.ts` — 4 hooks (list, restore-file, restore-folder, empty-trash)
- `use-sharing.ts` — 3 hooks for share link CRUD

### Menu Integration
- Listed in `src/config/tools-config.ts` as `id: 'file-manager'`, name "Gerenciador de Arquivos"
- Rendered in Tools Panel (`tools-panel.tsx`) alongside Calendar and Email
- NOT in main module navigation menu

## Drag-and-Drop (Phase 4.1) — ✅ DONE
- Native HTML5 DnD with `application/x-storage-item` MIME type
- Works on grid, list, and breadcrumb drop targets
- Multi-select via Ctrl+click
- `handleDragMoveToFolder` calls services directly + `Promise.allSettled` (avoids React Query race conditions)
- System folders block drops
- 6 E2E tests in `tests/e2e/file-manager/drag-and-drop.spec.ts`

## Move-to-Root — ✅ COMPLETE (Feb 2026)
- Zod schemas, use case interfaces, and controllers all support nullable folderId/parentId
- Unit tests for move-file-to-root and move-folder-to-root passing

## Completed Improvements (Feb 2026)
- ✅ Move-to-root backend nullable (Zod + use cases + controllers)
- ✅ File preview with presigned URLs (usePreviewFile hook)
- ✅ Root upload endpoint (POST /v1/storage/files)
- ✅ Admin controller routes registered
- ✅ Trash pagination (frontend page/limit controls)
- ✅ FileVersion tenantId defense-in-depth
- ✅ Rate limit by token on share links (10/min)
- ✅ Atomic quota check (Serializable transaction)
- ✅ Composite DB indexes (6 new indexes)
- ✅ Batch access check in ListFolderContents (N+1 fix)
- ✅ Batch FindById for bulk operations (N+1 fix)
- ✅ Presigned URL cache (LRU, 50min TTL)
- ✅ Search debounce (300ms)
- ✅ staleTime on queries (30s)
- ✅ Lazy loading thumbnails
- ✅ Client-side file size validation (50MB limit)
- ✅ Real upload progress (XHR with onprogress)
- ✅ StorageStatsCard rendered on /file-manager page
- ✅ Types in root barrel
- ✅ Storage cron jobs (gc + archive-expired)
- ✅ Storage permissions added to E2E auth helper
- ✅ E2E tests for 17 missing controllers (27 total E2E test files)
- ✅ Gzip compression for text-based files on S3 upload
- ✅ Server-side folder pagination (post-filter with totalFolders/totalFiles)
- ✅ Optimistic updates for rename/delete (files + folders)
- ✅ Folder download as ZIP (archiver, 500MB limit, presigned URL)
- ✅ getObject method on FileUploadService (S3 + Local)
- ✅ CompositeThumbnailService (extensible thumbnail pipeline, image support via Sharp)
- ✅ Multipart/chunked upload (S3 multipart for files >50MB, up to 500MB)
- ✅ Virtualization with @tanstack/react-virtual (grid + list views)

## Remaining Known Issues
- **PDF/video thumbnails** — CompositeThumbnailService ready, but only SharpThumbnailService (images) is registered. Add PdfThumbnailService/VideoThumbnailService when needed.
- **LocalFileUploadService** — returns `file://` paths (dev only), no multipart support (throws)
- **"Compartilhar" naming** — folder = ACL dialog, file = share link dialog
