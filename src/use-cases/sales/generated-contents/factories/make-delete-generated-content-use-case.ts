import { PrismaGeneratedContentsRepository } from '@/repositories/sales/prisma/prisma-generated-contents-repository';
import { DeleteGeneratedContentUseCase } from '../delete-generated-content';

export function makeDeleteGeneratedContentUseCase() {
  const generatedContentsRepository = new PrismaGeneratedContentsRepository();
  return new DeleteGeneratedContentUseCase(generatedContentsRepository);
}
