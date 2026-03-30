import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateShiftController } from './v1-create-shift.controller';
import { v1ListShiftsController } from './v1-list-shifts.controller';
import { v1GetShiftController } from './v1-get-shift.controller';
import { v1UpdateShiftController } from './v1-update-shift.controller';
import { v1DeleteShiftController } from './v1-delete-shift.controller';
import { v1AssignEmployeeToShiftController } from './v1-assign-employee-to-shift.controller';
import { v1UnassignEmployeeFromShiftController } from './v1-unassign-employee-from-shift.controller';
import { v1ListShiftAssignmentsController } from './v1-list-shift-assignments.controller';
import { v1TransferEmployeeShiftController } from './v1-transfer-employee-shift.controller';

export async function shiftsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', createModuleMiddleware('HR'));

  // Mutation routes with rate limit
  app.register(
    async (mutationApp) => {
      mutationApp.register(rateLimit, rateLimitConfig.mutation);
      mutationApp.register(v1CreateShiftController);
      mutationApp.register(v1UpdateShiftController);
      mutationApp.register(v1DeleteShiftController);
      mutationApp.register(v1AssignEmployeeToShiftController);
      mutationApp.register(v1UnassignEmployeeFromShiftController);
      mutationApp.register(v1TransferEmployeeShiftController);
    },
    { prefix: '' },
  );

  // Query routes
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1ListShiftsController);
      queryApp.register(v1GetShiftController);
      queryApp.register(v1ListShiftAssignmentsController);
    },
    { prefix: '' },
  );
}
