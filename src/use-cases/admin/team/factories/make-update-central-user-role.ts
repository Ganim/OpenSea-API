import { PrismaCentralUsersRepository } from '@/repositories/core/prisma/prisma-central-users-repository';
import { UpdateCentralUserRoleUseCase } from '../update-central-user-role';

export function makeUpdateCentralUserRoleUseCase() {
  const centralUsersRepository = new PrismaCentralUsersRepository();

  return new UpdateCentralUserRoleUseCase(centralUsersRepository);
}
