import type { FastifyInstance } from 'fastify';
import { createModuleMiddleware } from '@/http/middlewares/tenant/verify-module';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createEmployeeController } from './v1-create-employee.controller';
import { createEmployeeWithUserController } from './v1-create-employee-with-user.controller';
import { checkCpfController } from './v1-check-cpf.controller';
import { getEmployeeByIdController } from './v1-get-employee-by-id.controller';
import { getEmployeeByUserIdController } from './v1-get-employee-by-user-id.controller';
import { linkUserToEmployeeController } from './v1-link-user-to-employee.controller';
import { unlinkUserFromEmployeeController } from './v1-unlink-user-from-employee.controller';
import { listEmployeesController } from './v1-list-employees.controller';
import { deleteEmployeeController } from './v1-delete-employee.controller';
import { reactivateEmployeeController } from './v1-reactivate-employee.controller';
import { setEmployeeOnLeaveController } from './v1-set-employee-on-leave.controller';
import { suspendEmployeeController } from './v1-suspend-employee.controller';
import { terminateEmployeeController } from './v1-terminate-employee.controller';
import { transferEmployeeController } from './v1-transfer-employee.controller';
import { updateEmployeeController } from './v1-update-employee.controller';
import { getEmployeesLabelDataController } from './v1-get-employees-label-data.controller';
import { uploadEmployeePhotoController } from './v1-upload-employee-photo.controller';
import { deleteEmployeePhotoController } from './v1-delete-employee-photo.controller';

export async function employeesRoutes(app: FastifyInstance) {
  app.addHook('onRequest', createModuleMiddleware('HR'));

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createEmployeeController);
      managerApp.register(createEmployeeWithUserController);
      managerApp.register(updateEmployeeController);
      managerApp.register(terminateEmployeeController);
      managerApp.register(suspendEmployeeController);
      managerApp.register(reactivateEmployeeController);
      managerApp.register(setEmployeeOnLeaveController);
      managerApp.register(linkUserToEmployeeController);
      managerApp.register(unlinkUserFromEmployeeController);
      managerApp.register(transferEmployeeController);
      managerApp.register(deleteEmployeeController);
      managerApp.register(uploadEmployeePhotoController);
      managerApp.register(deleteEmployeePhotoController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getEmployeeByIdController);
      queryApp.register(getEmployeeByUserIdController);
      queryApp.register(listEmployeesController);
      queryApp.register(checkCpfController);
      queryApp.register(getEmployeesLabelDataController);
    },
    { prefix: '' },
  );
}
