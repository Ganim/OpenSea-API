import { PrismaEsocialRubricasRepository } from '@/repositories/esocial/prisma/prisma-esocial-rubricas-repository';
import { ListRubricasUseCase } from '../list-rubricas';

export function makeListRubricasUseCase(): ListRubricasUseCase {
  const rubricasRepository = new PrismaEsocialRubricasRepository();
  return new ListRubricasUseCase(rubricasRepository);
}
