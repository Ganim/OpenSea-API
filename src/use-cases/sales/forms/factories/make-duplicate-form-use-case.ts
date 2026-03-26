import { PrismaFormFieldsRepository } from '@/repositories/sales/prisma/prisma-form-fields-repository';
import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { DuplicateFormUseCase } from '../duplicate-form';

export function makeDuplicateFormUseCase() {
  return new DuplicateFormUseCase(
    new PrismaFormsRepository(),
    new PrismaFormFieldsRepository(),
  );
}
