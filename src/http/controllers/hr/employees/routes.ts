import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { createEmployeeController } from './v1-create-employee.controller';
import { createEmployeeWithUserController } from './v1-create-employee-with-user.controller';
import { checkCpfController } from './v1-check-cpf.controller';
import { getEmployeeByIdController } from './v1-get-employee-by-id.controller';
import { linkUserToEmployeeController } from './v1-link-user-to-employee.controller';
import { listEmployeesController } from './v1-list-employees.controller';
import { deleteEmployeeController } from './v1-delete-employee.controller';
import { terminateEmployeeController } from './v1-terminate-employee.controller';
import { transferEmployeeController } from './v1-transfer-employee.controller';
import { updateEmployeeController } from './v1-update-employee.controller';
import { getEmployeesLabelDataController } from './v1-get-employees-label-data.controller';

export async function employeesRoutes() {
  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createEmployeeController);
      managerApp.register(createEmployeeWithUserController);
      managerApp.register(updateEmployeeController);
      managerApp.register(terminateEmployeeController);
      managerApp.register(linkUserToEmployeeController);
      managerApp.register(transferEmployeeController);
      managerApp.register(deleteEmployeeController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getEmployeeByIdController);
      queryApp.register(listEmployeesController);
      queryApp.register(checkCpfController);
      queryApp.register(getEmployeesLabelDataController);
    },
    { prefix: '' },
  );
}
