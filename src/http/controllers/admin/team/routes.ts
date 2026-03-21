import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1InviteCentralUserController } from './v1-invite-central-user.controller';
import { v1ListCentralUsersController } from './v1-list-central-users.controller';
import { v1RemoveCentralUserController } from './v1-remove-central-user.controller';
import { v1UpdateCentralUserRoleController } from './v1-update-central-user-role.controller';

export async function adminTeamRoutes(app: FastifyInstance) {
  // Team mutation routes
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(v1InviteCentralUserController);
      adminApp.register(v1UpdateCentralUserRoleController);
      adminApp.register(v1RemoveCentralUserController);
    },
    { prefix: '' },
  );

  // Team query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListCentralUsersController);
    },
    { prefix: '' },
  );
}
