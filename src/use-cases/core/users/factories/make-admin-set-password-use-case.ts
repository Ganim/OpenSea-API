import { PrismaAuthLinksRepository } from '@/repositories/core/prisma/prisma-auth-links-repository';
import { PrismaSessionsRepository } from '@/repositories/core/prisma/prisma-sessions-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { AdminSetPasswordUseCase } from '../admin-set-password';

export function makeAdminSetPasswordUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const authLinksRepository = new PrismaAuthLinksRepository();
  const sessionsRepository = new PrismaSessionsRepository();
  return new AdminSetPasswordUseCase(
    usersRepository,
    authLinksRepository,
    sessionsRepository,
  );
}
