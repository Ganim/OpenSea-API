import { PrismaGeneratedContentsRepository } from '@/repositories/sales/prisma/prisma-generated-contents-repository';
import { CreateGeneratedContentUseCase } from '../create-generated-content';

export function makeCreateGeneratedContentUseCase() {
  const generatedContentsRepository = new PrismaGeneratedContentsRepository();
  return new CreateGeneratedContentUseCase(generatedContentsRepository);
}
