import { PrismaEsocialRubricasRepository } from '@/repositories/esocial/prisma/prisma-esocial-rubricas-repository';
import { CreateRubricaUseCase } from '../create-rubrica';

export function makeCreateRubricaUseCase(): CreateRubricaUseCase {
  const rubricasRepository = new PrismaEsocialRubricasRepository();
  return new CreateRubricaUseCase(rubricasRepository);
}
