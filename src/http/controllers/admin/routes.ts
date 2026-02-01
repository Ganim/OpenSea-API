import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { adminDashboardController } from './v1-admin-dashboard.controller';
import { changeTenantPlanAdminController } from './v1-change-tenant-plan.controller';
import { changeTenantStatusAdminController } from './v1-change-tenant-status.controller';
import { createPlanAdminController } from './v1-create-plan.controller';
import { deletePlanAdminController } from './v1-delete-plan.controller';
import { getPlanByIdAdminController } from './v1-get-plan-by-id.controller';
import { getTenantDetailsAdminController } from './v1-get-tenant-details.controller';
import { listPlansAdminController } from './v1-list-plans.controller';
import { listTenantUsersAdminController } from './v1-list-tenant-users.controller';
import { listTenantsAdminController } from './v1-list-tenants.controller';
import { manageFeatureFlagsAdminController } from './v1-manage-feature-flags.controller';
import { setPlanModulesAdminController } from './v1-set-plan-modules.controller';
import { updatePlanAdminController } from './v1-update-plan.controller';

export async function adminRoutes() {
  // All admin routes use elevated rate limits
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(changeTenantStatusAdminController);
      adminApp.register(changeTenantPlanAdminController);
      adminApp.register(manageFeatureFlagsAdminController);
      adminApp.register(createPlanAdminController);
      adminApp.register(updatePlanAdminController);
      adminApp.register(deletePlanAdminController);
      adminApp.register(setPlanModulesAdminController);
    },
    { prefix: '' },
  );

  // Admin query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(listTenantsAdminController);
      queryApp.register(getTenantDetailsAdminController);
      queryApp.register(listTenantUsersAdminController);
      queryApp.register(listPlansAdminController);
      queryApp.register(getPlanByIdAdminController);
      queryApp.register(adminDashboardController);
    },
    { prefix: '' },
  );
}
