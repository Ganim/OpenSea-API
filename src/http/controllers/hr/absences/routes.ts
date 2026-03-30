import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1ApproveAbsenceController } from './v1-approve-absence.controller';
import { v1CancelAbsenceController } from './v1-cancel-absence.controller';
import { v1GetAbsenceController } from './v1-get-absence.controller';
import { v1GetVacationBalanceController } from './v1-get-vacation-balance.controller';
import { v1ListAbsencesController } from './v1-list-absences.controller';
import { v1RejectAbsenceController } from './v1-reject-absence.controller';
import { v1RequestSickLeaveController } from './v1-request-sick-leave.controller';
import { v1RequestVacationController } from './v1-request-vacation.controller';
import { v1UpdateAbsenceController } from './v1-update-absence.controller';

export async function absencesRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1RequestVacationController);
      mutationApp.register(v1RequestSickLeaveController);
      mutationApp.register(v1ApproveAbsenceController);
      mutationApp.register(v1RejectAbsenceController);
      mutationApp.register(v1CancelAbsenceController);
      mutationApp.register(v1UpdateAbsenceController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetAbsenceController);
      queryApp.register(v1ListAbsencesController);
      queryApp.register(v1GetVacationBalanceController);
    },
    { prefix: '' },
  );
}
