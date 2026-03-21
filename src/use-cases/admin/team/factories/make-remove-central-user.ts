import { PrismaCentralUsersRepository } from '@/repositories/core/prisma/prisma-central-users-repository';
import { RemoveCentralUserUseCase } from '../remove-central-user';

export function makeRemoveCentralUserUseCase() {
  const centralUsersRepository = new PrismaCentralUsersRepository();

  return new RemoveCentralUserUseCase(centralUsersRepository);
}
