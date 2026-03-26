import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { DeleteFormUseCase } from '../delete-form';

export function makeDeleteFormUseCase() {
  return new DeleteFormUseCase(new PrismaFormsRepository());
}
