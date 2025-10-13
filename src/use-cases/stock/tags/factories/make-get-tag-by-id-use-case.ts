import { PrismaTagsRepository } from '@/repositories/stock/prisma/prisma-tags-repository';
import { GetTagByIdUseCase } from '../get-tag-by-id';

export function makeGetTagByIdUseCase() {
  const tagsRepository = new PrismaTagsRepository();
  const getTagByIdUseCase = new GetTagByIdUseCase(tagsRepository);
  return getTagByIdUseCase;
}
