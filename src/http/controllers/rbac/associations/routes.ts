import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { addPermissionToGroupController } from './v1-add-permission-to-group.controller';
import { assignGroupToUserController } from './v1-assign-group-to-user.controller';
import { listGroupPermissionsController } from './v1-list-group-permissions.controller';
import { listUserGroupsController } from './v1-list-user-groups.controller';
import { listUserPermissionsController } from './v1-list-user-permissions.controller';
import { listUsersByGroupController } from './v1-list-users-by-group.controller';
import { removeGroupFromUserController } from './v1-remove-group-from-user.controller';
import { removePermissionFromGroupController } from './v1-remove-permission-from-group.controller';

export async function associationsRoutes() {
  // Admin routes - mutations
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(addPermissionToGroupController);
      adminApp.register(removePermissionFromGroupController);
      adminApp.register(assignGroupToUserController);
      adminApp.register(removeGroupFromUserController);
      adminApp.register(listUsersByGroupController);
    },
    { prefix: '' },
  );

  // Authenticated routes - queries
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listGroupPermissionsController);
      queryApp.register(listUserGroupsController);
      queryApp.register(listUserPermissionsController);
    },
    { prefix: '' },
  );
}
