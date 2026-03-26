import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { v1CreateEmployeeController } from './v1-create-employee.controller';
import { v1CreateEmployeeWithUserController } from './v1-create-employee-with-user.controller';
import { v1CheckCpfController } from './v1-check-cpf.controller';
import { v1GetEmployeeByIdController } from './v1-get-employee-by-id.controller';
import { v1GetEmployeeByUserIdController } from './v1-get-employee-by-user-id.controller';
import { v1LinkUserToEmployeeController } from './v1-link-user-to-employee.controller';
import { v1UnlinkUserFromEmployeeController } from './v1-unlink-user-from-employee.controller';
import { v1ListEmployeesController } from './v1-list-employees.controller';
import { v1DeleteEmployeeController } from './v1-delete-employee.controller';
import { v1ReactivateEmployeeController } from './v1-reactivate-employee.controller';
import { v1SetEmployeeOnLeaveController } from './v1-set-employee-on-leave.controller';
import { v1SuspendEmployeeController } from './v1-suspend-employee.controller';
import { v1TerminateEmployeeController } from './v1-terminate-employee.controller';
import { v1TransferEmployeeController } from './v1-transfer-employee.controller';
import { v1UpdateEmployeeController } from './v1-update-employee.controller';
import { v1GetEmployeesLabelDataController } from './v1-get-employees-label-data.controller';
import { v1UploadEmployeePhotoController } from './v1-upload-employee-photo.controller';
import { v1DeleteEmployeePhotoController } from './v1-delete-employee-photo.controller';
import { v1GeneratePPPController } from './v1-generate-ppp.controller';

export async function employeesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(v1CreateEmployeeController);
      managerApp.register(v1CreateEmployeeWithUserController);
      managerApp.register(v1UpdateEmployeeController);
      managerApp.register(v1TerminateEmployeeController);
      managerApp.register(v1SuspendEmployeeController);
      managerApp.register(v1ReactivateEmployeeController);
      managerApp.register(v1SetEmployeeOnLeaveController);
      managerApp.register(v1LinkUserToEmployeeController);
      managerApp.register(v1UnlinkUserFromEmployeeController);
      managerApp.register(v1TransferEmployeeController);
      managerApp.register(v1DeleteEmployeeController);
      managerApp.register(v1UploadEmployeePhotoController);
      managerApp.register(v1DeleteEmployeePhotoController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(v1GetEmployeeByIdController);
      queryApp.register(v1GetEmployeeByUserIdController);
      queryApp.register(v1ListEmployeesController);
      queryApp.register(v1CheckCpfController);
      queryApp.register(v1GetEmployeesLabelDataController);
      queryApp.register(v1GeneratePPPController);
    },
    { prefix: '' },
  );
}
