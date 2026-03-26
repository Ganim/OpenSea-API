import { PrismaCipaMembersRepository } from '@/repositories/hr/prisma/prisma-cipa-members-repository';
import { RemoveCipaMemberUseCase } from '../remove-cipa-member';

export function makeRemoveCipaMemberUseCase() {
  const cipaMembersRepository = new PrismaCipaMembersRepository();
  return new RemoveCipaMemberUseCase(cipaMembersRepository);
}
