import { PrismaFormFieldsRepository } from '@/repositories/sales/prisma/prisma-form-fields-repository';
import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { CreateFormUseCase } from '../create-form';

export function makeCreateFormUseCase() {
  const formsRepository = new PrismaFormsRepository();
  const formFieldsRepository = new PrismaFormFieldsRepository();
  return new CreateFormUseCase(formsRepository, formFieldsRepository);
}
