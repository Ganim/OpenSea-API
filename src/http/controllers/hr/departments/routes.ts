import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { v1CreateDepartmentController } from './v1-create-department.controller';
import { v1DeleteDepartmentController } from './v1-delete-department.controller';
import { v1GetDepartmentByIdController } from './v1-get-department-by-id.controller';
import { v1ListDepartmentsController } from './v1-list-departments.controller';
import { v1UpdateDepartmentController } from './v1-update-department.controller';

export async function departmentsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Manager routes with mutation rate limit
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(v1CreateDepartmentController);
      managerApp.register(v1UpdateDepartmentController);
      managerApp.register(v1DeleteDepartmentController);
    },
    { prefix: '' },
  );

  // Authenticated routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetDepartmentByIdController);
      queryApp.register(v1ListDepartmentsController);
    },
    { prefix: '' },
  );
}
