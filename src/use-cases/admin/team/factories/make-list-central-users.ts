import { PrismaCentralUsersRepository } from '@/repositories/core/prisma/prisma-central-users-repository';
import { ListCentralUsersUseCase } from '../list-central-users';

export function makeListCentralUsersUseCase() {
  const centralUsersRepository = new PrismaCentralUsersRepository();

  return new ListCentralUsersUseCase(centralUsersRepository);
}
