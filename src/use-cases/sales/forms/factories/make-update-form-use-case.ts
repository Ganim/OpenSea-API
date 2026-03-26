import { PrismaFormFieldsRepository } from '@/repositories/sales/prisma/prisma-form-fields-repository';
import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { UpdateFormUseCase } from '../update-form';

export function makeUpdateFormUseCase() {
  const formsRepository = new PrismaFormsRepository();
  const formFieldsRepository = new PrismaFormFieldsRepository();
  return new UpdateFormUseCase(formsRepository, formFieldsRepository);
}
