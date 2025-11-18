import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createPermissionController } from './v1-create-permission.controller';
import { deletePermissionController } from './v1-delete-permission.controller';
import { getPermissionByCodeController } from './v1-get-permission-by-code.controller';
import { getPermissionByIdController } from './v1-get-permission-by-id.controller';
import { listPermissionsController } from './v1-list-permissions.controller';
import { updatePermissionController } from './v1-update-permission.controller';

export async function permissionsRoutes() {
  // Admin routes - mutations (create, update, delete)
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(createPermissionController);
      adminApp.register(updatePermissionController);
      adminApp.register(deletePermissionController);
    },
    { prefix: '' },
  );

  // Authenticated routes - queries (list, get)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listPermissionsController);
      queryApp.register(getPermissionByIdController);
      queryApp.register(getPermissionByCodeController);
    },
    { prefix: '' },
  );
}
