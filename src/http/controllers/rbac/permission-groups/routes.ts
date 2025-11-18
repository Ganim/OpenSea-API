import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createPermissionGroupController } from './v1-create-permission-group.controller';
import { deletePermissionGroupController } from './v1-delete-permission-group.controller';
import { getPermissionGroupByIdController } from './v1-get-permission-group-by-id.controller';
import { listPermissionGroupsController } from './v1-list-permission-groups.controller';
import { updatePermissionGroupController } from './v1-update-permission-group.controller';

export async function permissionGroupsRoutes() {
  // Admin routes - mutations (create, update, delete)
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(createPermissionGroupController);
      adminApp.register(updatePermissionGroupController);
      adminApp.register(deletePermissionGroupController);
    },
    { prefix: '' },
  );

  // Authenticated routes - queries (list, get)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listPermissionGroupsController);
      queryApp.register(getPermissionGroupByIdController);
    },
    { prefix: '' },
  );
}
