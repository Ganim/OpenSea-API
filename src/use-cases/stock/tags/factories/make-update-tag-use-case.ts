import { PrismaTagsRepository } from '@/repositories/stock/prisma/prisma-tags-repository';
import { UpdateTagUseCase } from '../update-tag';

export function makeUpdateTagUseCase() {
  const tagsRepository = new PrismaTagsRepository();
  const updateTagUseCase = new UpdateTagUseCase(tagsRepository);
  return updateTagUseCase;
}
