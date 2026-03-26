import { PrismaFormsRepository } from '@/repositories/sales/prisma/prisma-forms-repository';
import { PublishFormUseCase } from '../publish-form';

export function makePublishFormUseCase() {
  return new PublishFormUseCase(new PrismaFormsRepository());
}
