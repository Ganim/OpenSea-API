import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createTenantController } from './v1-create-tenant.controller';
import { getTenantController } from './v1-get-tenant.controller';
import { inviteUserToTenantController } from './v1-invite-user.controller';
import { removeUserFromTenantController } from './v1-remove-user.controller';
import { updateTenantController } from './v1-update-tenant.controller';

export async function tenantsRoutes() {
  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(removeUserFromTenantController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutacao
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createTenantController);
      managerApp.register(updateTenantController);
      managerApp.register(inviteUserToTenantController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getTenantController);
    },
    { prefix: '' },
  );
}
