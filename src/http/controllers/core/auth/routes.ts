import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { authenticateWithAccessPinController } from './v1-authenticate-with-access-pin.controller';
import { authenticateWithPasswordController } from './v1-authenticate-with-password.controller';
import { listUserTenantsController } from './v1-list-user-tenants.controller';
import { registerNewUserController } from './v1-register-new-user.controller';
import { resetPasswordByTokenController } from './v1-reset-password-by-token.controller';
import { selectTenantController } from './v1-select-tenant.controller';
import { sendPasswordResetTokenController } from './v1-send-password-reset-token.controller';

export async function authRoutes() {
  // Public Routes com rate limit específico para autenticação (proteção contra brute force)
  app.register(
    async (authApp) => {
      authApp.register(rateLimit, rateLimitConfig.auth);
      authApp.register(authenticateWithPasswordController);
      authApp.register(authenticateWithAccessPinController);
      authApp.register(registerNewUserController);
      authApp.register(resetPasswordByTokenController);
      authApp.register(sendPasswordResetTokenController);
    },
    { prefix: '' },
  );

  // Authenticated tenant selection routes
  app.register(
    async (tenantApp) => {
      tenantApp.register(rateLimit, rateLimitConfig.query);
      tenantApp.register(listUserTenantsController);
      tenantApp.register(selectTenantController);
    },
    { prefix: '' },
  );
}
