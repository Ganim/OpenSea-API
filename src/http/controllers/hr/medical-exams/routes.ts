import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateMedicalExamController } from './v1-create-medical-exam.controller';
import { v1UpdateMedicalExamController } from './v1-update-medical-exam.controller';
import { v1DeleteMedicalExamController } from './v1-delete-medical-exam.controller';
import { v1GetMedicalExamController } from './v1-get-medical-exam.controller';
import { v1ListMedicalExamsController } from './v1-list-medical-exams.controller';
import { v1ListExpiringExamsController } from './v1-list-expiring-exams.controller';
import { v1ListOverdueExamsController } from './v1-list-overdue-exams.controller';

export async function medicalExamsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateMedicalExamController);
      mutationApp.register(v1UpdateMedicalExamController);
      mutationApp.register(v1DeleteMedicalExamController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListExpiringExamsController);
      queryApp.register(v1ListOverdueExamsController);
      queryApp.register(v1GetMedicalExamController);
      queryApp.register(v1ListMedicalExamsController);
    },
    { prefix: '' },
  );
}
