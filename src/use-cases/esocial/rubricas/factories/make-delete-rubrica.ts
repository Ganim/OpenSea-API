import { PrismaEsocialRubricasRepository } from '@/repositories/esocial/prisma/prisma-esocial-rubricas-repository';
import { DeleteRubricaUseCase } from '../delete-rubrica';

export function makeDeleteRubricaUseCase(): DeleteRubricaUseCase {
  const rubricasRepository = new PrismaEsocialRubricasRepository();
  return new DeleteRubricaUseCase(rubricasRepository);
}
