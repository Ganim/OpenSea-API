import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { bulkDeleteItemsController } from './v1-bulk-delete-items.controller';
import { bulkMoveItemsController } from './v1-bulk-move-items.controller';
import { deleteFileController } from './v1-delete-file.controller';
import { downloadFileController } from './v1-download-file.controller';
import { getFileActivityController } from './v1-get-file-activity.controller';
import { getFileController } from './v1-get-file.controller';
import { getStorageStatsController } from './v1-get-storage-stats.controller';
import { listFileVersionsController } from './v1-list-file-versions.controller';
import { listFilesController } from './v1-list-files.controller';
import { moveFileController } from './v1-move-file.controller';
import { previewFileController } from './v1-preview-file.controller';
import { renameFileController } from './v1-rename-file.controller';
import { restoreFileVersionController } from './v1-restore-file-version.controller';
import { uploadFileController } from './v1-upload-file.controller';
import { uploadFileRootController } from './v1-upload-file-root.controller';
import { uploadFileVersionController } from './v1-upload-file-version.controller';
import { searchStorageController } from './v1-search-storage.controller';

export async function storageFilesRoutes(app: FastifyInstance) {
  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteFileController);
      adminApp.register(bulkDeleteItemsController);
    },
    { prefix: '' },
  );

  // Heavy routes (uploads)
  app.register(
    async (heavyApp) => {
      heavyApp.register(rateLimit, rateLimitConfig.heavy);
      heavyApp.register(uploadFileController);
      heavyApp.register(uploadFileRootController);
      heavyApp.register(uploadFileVersionController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(renameFileController);
      mutationApp.register(moveFileController);
      mutationApp.register(restoreFileVersionController);
      mutationApp.register(bulkMoveItemsController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getFileController);
      queryApp.register(listFilesController);
      queryApp.register(downloadFileController);
      queryApp.register(previewFileController);
      queryApp.register(getFileActivityController);
      queryApp.register(listFileVersionsController);
      queryApp.register(getStorageStatsController);
      queryApp.register(searchStorageController);
    },
    { prefix: '' },
  );
}
