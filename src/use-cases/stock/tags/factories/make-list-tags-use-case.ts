import { PrismaTagsRepository } from '@/repositories/stock/prisma/prisma-tags-repository';
import { ListTagsUseCase } from '../list-tags';

export function makeListTagsUseCase() {
  const tagsRepository = new PrismaTagsRepository();
  const listTagsUseCase = new ListTagsUseCase(tagsRepository);
  return listTagsUseCase;
}
