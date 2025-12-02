import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { approveAbsenceController } from './v1-approve-absence.controller';
import { cancelAbsenceController } from './v1-cancel-absence.controller';
import { getAbsenceController } from './v1-get-absence.controller';
import { getVacationBalanceController } from './v1-get-vacation-balance.controller';
import { listAbsencesController } from './v1-list-absences.controller';
import { rejectAbsenceController } from './v1-reject-absence.controller';
import { requestSickLeaveController } from './v1-request-sick-leave.controller';
import { requestVacationController } from './v1-request-vacation.controller';

export async function absencesRoutes() {
  // Mutation routes
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(requestVacationController);
      mutationApp.register(requestSickLeaveController);
      mutationApp.register(approveAbsenceController);
      mutationApp.register(rejectAbsenceController);
      mutationApp.register(cancelAbsenceController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getAbsenceController);
      queryApp.register(listAbsencesController);
      queryApp.register(getVacationBalanceController);
    },
    { prefix: '' },
  );
}
