import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { UnpublishFormUseCase } from '../unpublish-form';

export function makeUnpublishFormUseCase() {
  return new UnpublishFormUseCase(new PrismaFormsRepository());
}
