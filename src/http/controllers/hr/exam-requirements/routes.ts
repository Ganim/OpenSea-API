import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateExamRequirementController } from './v1-create-exam-requirement.controller';
import { v1ListExamRequirementsController } from './v1-list-exam-requirements.controller';
import { v1DeleteExamRequirementController } from './v1-delete-exam-requirement.controller';
import { v1CheckEmployeeComplianceController } from './v1-check-employee-compliance.controller';

export async function examRequirementsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateExamRequirementController);
      mutationApp.register(v1DeleteExamRequirementController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListExamRequirementsController);
      queryApp.register(v1CheckEmployeeComplianceController);
    },
    { prefix: '' },
  );
}
