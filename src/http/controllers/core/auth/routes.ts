import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { loginBruteforceGuard } from '@/http/plugins/login-bruteforce-guard.plugin';
import { authenticateUnifiedController } from './v1-authenticate-unified.controller';
import { authenticateWithAccessPinController } from './v1-authenticate-with-access-pin.controller';
import { authenticateWithPasswordController } from './v1-authenticate-with-password.controller';
import { getAuthMethodsController } from './v1-get-auth-methods.controller';
import { getTenantAuthConfigController } from './v1-get-tenant-auth-config.controller';
import { listUserTenantsController } from './v1-list-user-tenants.controller';
import { registerNewUserController } from './v1-register-new-user.controller';
import { requestMagicLinkController } from './v1-request-magic-link.controller';
import { resetPasswordByTokenController } from './v1-reset-password-by-token.controller';
import { selectTenantController } from './v1-select-tenant.controller';
import { routineCheckController } from './v1-routine-check.controller';
import { sendPasswordResetTokenController } from './v1-send-password-reset-token.controller';
import { updateTenantAuthConfigController } from './v1-update-tenant-auth-config.controller';
import { verifyMagicLinkController } from './v1-verify-magic-link.controller';

export async function authRoutes(app: FastifyInstance) {
  // Public Routes com rate limit específico para autenticação (proteção contra brute force)
  app.register(
    async (authApp) => {
      authApp.register(rateLimit, rateLimitConfig.auth);
      authApp.register(loginBruteforceGuard); // Blocks IP after 10 failed logins in 15min
      authApp.register(authenticateWithPasswordController);
      authApp.register(authenticateWithAccessPinController);
      authApp.register(authenticateUnifiedController);
      authApp.register(registerNewUserController);
      authApp.register(resetPasswordByTokenController);
      authApp.register(sendPasswordResetTokenController);
      authApp.register(requestMagicLinkController);
      authApp.register(verifyMagicLinkController);
    },
    { prefix: '' },
  );

  // Public query routes (no auth required)
  app.register(
    async (publicApp) => {
      publicApp.register(rateLimit, rateLimitConfig.query);
      publicApp.register(getAuthMethodsController);
    },
    { prefix: '' },
  );

  // Authenticated tenant selection routes
  app.register(
    async (tenantApp) => {
      tenantApp.register(rateLimit, rateLimitConfig.query);
      tenantApp.register(listUserTenantsController);
      tenantApp.register(selectTenantController);
      tenantApp.register(routineCheckController);
    },
    { prefix: '' },
  );

  // Authenticated tenant auth config routes
  app.register(
    async (configApp) => {
      configApp.register(rateLimit, rateLimitConfig.query);
      configApp.register(getTenantAuthConfigController);
      configApp.register(updateTenantAuthConfigController);
    },
    { prefix: '' },
  );
}
