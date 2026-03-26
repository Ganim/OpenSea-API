import { PrismaFormFieldsRepository } from '@/repositories/sales/prisma/prisma-form-fields-repository';
import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { GetFormByIdUseCase } from '../get-form-by-id';

export function makeGetFormByIdUseCase() {
  return new GetFormByIdUseCase(
    new PrismaFormsRepository(),
    new PrismaFormFieldsRepository(),
  );
}
