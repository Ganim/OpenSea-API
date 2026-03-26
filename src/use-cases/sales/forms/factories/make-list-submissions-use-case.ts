import { PrismaFormSubmissionsRepository } from '@/repositories/sales/prisma/prisma-form-submissions-repository';
import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { ListSubmissionsUseCase } from '../list-submissions';

export function makeListSubmissionsUseCase() {
  return new ListSubmissionsUseCase(
    new PrismaFormsRepository(),
    new PrismaFormSubmissionsRepository(),
  );
}
