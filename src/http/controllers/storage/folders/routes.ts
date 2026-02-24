import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createFolderController } from './v1-create-folder.controller';
import { deleteFolderController } from './v1-delete-folder.controller';
import { ensureEntityFolderController } from './v1-ensure-entity-folder.controller';
import { getBreadcrumbController } from './v1-get-breadcrumb.controller';
import { getFolderController } from './v1-get-folder.controller';
import { getFilterFolderContentsController } from './v1-get-filter-folder-contents.controller';
import { initializeFoldersController } from './v1-initialize-folders.controller';
import { listFolderContentsController } from './v1-list-folder-contents.controller';
import { moveFolderController } from './v1-move-folder.controller';
import { renameFolderController } from './v1-rename-folder.controller';
import { searchFoldersController } from './v1-search-folders.controller';
import { updateFolderController } from './v1-update-folder.controller';

export async function storageFoldersRoutes() {
  // Admin routes with elevated rate limit
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(deleteFolderController);
    },
    { prefix: '' },
  );

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(createFolderController);
      mutationApp.register(initializeFoldersController);
      mutationApp.register(ensureEntityFolderController);
      mutationApp.register(renameFolderController);
      mutationApp.register(moveFolderController);
      mutationApp.register(updateFolderController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getFolderController);
      queryApp.register(listFolderContentsController);
      queryApp.register(getBreadcrumbController);
      queryApp.register(searchFoldersController);
      queryApp.register(getFilterFolderContentsController);
    },
    { prefix: '' },
  );
}
