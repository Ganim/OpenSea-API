import { PrismaTagsRepository } from '@/repositories/stock/prisma/prisma-tags-repository';
import { DeleteTagUseCase } from '../delete-tag';

export function makeDeleteTagUseCase() {
  const tagsRepository = new PrismaTagsRepository();
  const deleteTagUseCase = new DeleteTagUseCase(tagsRepository);
  return deleteTagUseCase;
}
