import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { grantDirectPermissionController } from './v1-grant-direct-permission.controller';
import { listUserDirectPermissionsController } from './v1-list-user-direct-permissions.controller';
import { listUsersByPermissionController } from './v1-list-users-by-permission.controller';
import { revokeDirectPermissionController } from './v1-revoke-direct-permission.controller';
import { updateDirectPermissionController } from './v1-update-direct-permission.controller';

export async function userDirectPermissionsRoutes() {
  // Admin routes - mutations (grant, revoke, update)
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(grantDirectPermissionController);
      adminApp.register(revokeDirectPermissionController);
      adminApp.register(updateDirectPermissionController);
      adminApp.register(listUsersByPermissionController);
    },
    { prefix: '' },
  );

  // Authenticated routes - queries (list)
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listUserDirectPermissionsController);
    },
    { prefix: '' },
  );
}
