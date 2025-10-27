import { app } from '@/app';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { changeUserEmailController } from './v1-change-user-email.controller';
import { changeUserPasswordController } from './v1-change-user-password.controller';
import { changeUserProfileController } from './v1-change-user-profile.controller';
import { changeUserRoleController } from './v1-change-user-role.controller';
import { changeUserUsernameController } from './v1-change-user-username.controller';
import { createUserController } from './v1-create-user.controller';
import { DeleteUserByIdController } from './v1-delete-user-by-id.controller';
import { getUserByEmailController } from './v1-get-user-by-email.controller';
import { getUserByIdController } from './v1-get-user-by-id.controller';
import { getUserByUsernameController } from './v1-get-user-by-username.controller';
import { listAllUsersByRoleController } from './v1-list-all-users-by-role.controller';
import { listAllUsersController } from './v1-list-all-users.controller';
import { listOnlineUsersController } from './v1-list-online-users.controller';

export async function usersRoutes() {
  // Admin routes com rate limit elevado
  app.register(
    async (adminApp) => {
      adminApp.register(rateLimit, rateLimitConfig.admin);
      adminApp.register(changeUserEmailController);
      adminApp.register(changeUserPasswordController);
      adminApp.register(changeUserRoleController);
      adminApp.register(changeUserUsernameController);
      adminApp.register(changeUserProfileController);
      adminApp.register(DeleteUserByIdController);
      adminApp.register(listAllUsersByRoleController);
    },
    { prefix: '' },
  );

  // Manager routes com rate limit de mutação
  app.register(
    async (managerApp) => {
      managerApp.register(rateLimit, rateLimitConfig.mutation);
      managerApp.register(createUserController);
      managerApp.register(listAllUsersController);
    },
    { prefix: '' },
  );

  // Authenticated routes com rate limit de consulta
  app.register(
    async (queryApp) => {
      queryApp.register(rateLimit, rateLimitConfig.query);
      queryApp.register(getUserByIdController);
      queryApp.register(getUserByEmailController);
      queryApp.register(getUserByUsernameController);
      queryApp.register(listOnlineUsersController);
    },
    { prefix: '' },
  );
}
