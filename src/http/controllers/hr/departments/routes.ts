import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import type { FastifyInstance } from 'fastify';
import { createDepartmentController } from './v1-create-department.controller';
import { deleteDepartmentController } from './v1-delete-department.controller';
import { getDepartmentByIdController } from './v1-get-department-by-id.controller';
import { listDepartmentsController } from './v1-list-departments.controller';
import { updateDepartmentController } from './v1-update-department.controller';

export async function departmentsRoutes(app: FastifyInstance) {
  // Manager routes with mutation rate limit
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createDepartmentController);
      managerApp.register(updateDepartmentController);
      managerApp.register(deleteDepartmentController);
    },
    { prefix: '' },
  );

  // Authenticated routes with query rate limit
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getDepartmentByIdController);
      queryApp.register(listDepartmentsController);
    },
    { prefix: '' },
  );
}
