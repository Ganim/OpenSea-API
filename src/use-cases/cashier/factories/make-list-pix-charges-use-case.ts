import { PrismaPixChargesRepository } from '@/repositories/cashier/prisma/prisma-pix-charges-repository';
import { ListPixChargesUseCase } from '../list-pix-charges';

export function makeListPixChargesUseCase() {
  const pixChargesRepository = new PrismaPixChargesRepository();

  return new ListPixChargesUseCase(pixChargesRepository);
}
