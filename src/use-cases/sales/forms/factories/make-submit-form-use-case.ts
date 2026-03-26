import { PrismaFormSubmissionsRepository } from '@/repositories/sales/prisma/prisma-form-submissions-repository';
import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { SubmitFormUseCase } from '../submit-form';

export function makeSubmitFormUseCase() {
  return new SubmitFormUseCase(
    new PrismaFormsRepository(),
    new PrismaFormSubmissionsRepository(),
  );
}
