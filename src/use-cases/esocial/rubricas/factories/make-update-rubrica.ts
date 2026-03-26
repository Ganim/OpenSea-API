import { PrismaEsocialRubricasRepository } from '@/repositories/esocial/prisma/prisma-esocial-rubricas-repository';
import { UpdateRubricaUseCase } from '../update-rubrica';

export function makeUpdateRubricaUseCase(): UpdateRubricaUseCase {
  const rubricasRepository = new PrismaEsocialRubricasRepository();
  return new UpdateRubricaUseCase(rubricasRepository);
}
