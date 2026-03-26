import { PrismaCipaMembersRepository } from '@/repositories/hr/prisma/prisma-cipa-members-repository';
import { ListCipaMembersUseCase } from '../list-cipa-members';

export function makeListCipaMembersUseCase() {
  const cipaMembersRepository = new PrismaCipaMembersRepository();
  return new ListCipaMembersUseCase(cipaMembersRepository);
}
