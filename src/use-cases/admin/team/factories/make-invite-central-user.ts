import { PrismaCentralUsersRepository } from '@/repositories/core/prisma/prisma-central-users-repository';
import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { InviteCentralUserUseCase } from '../invite-central-user';

export function makeInviteCentralUserUseCase() {
  const centralUsersRepository = new PrismaCentralUsersRepository();
  const usersRepository = new PrismaUsersRepository();

  return new InviteCentralUserUseCase(centralUsersRepository, usersRepository);
}
