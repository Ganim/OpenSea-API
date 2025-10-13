import { PrismaTagsRepository } from '@/repositories/stock/prisma/prisma-tags-repository';
import { CreateTagUseCase } from '../create-tag';

export function makeCreateTagUseCase() {
  const tagsRepository = new PrismaTagsRepository();
  const createTagUseCase = new CreateTagUseCase(tagsRepository);
  return createTagUseCase;
}
