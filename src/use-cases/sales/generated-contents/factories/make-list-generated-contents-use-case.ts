import { PrismaGeneratedContentsRepository } from '@/repositories/sales/prisma/prisma-generated-contents-repository';
import { ListGeneratedContentsUseCase } from '../list-generated-contents';

export function makeListGeneratedContentsUseCase() {
  const generatedContentsRepository = new PrismaGeneratedContentsRepository();
  return new ListGeneratedContentsUseCase(generatedContentsRepository);
}
