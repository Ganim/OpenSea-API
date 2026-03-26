import { PrismaEsocialConfigRepository } from '@/repositories/esocial/prisma/prisma-esocial-config-repository';
import { UpdateEsocialConfigUseCase } from '../update-esocial-config';

export function makeUpdateEsocialConfigUseCase(): UpdateEsocialConfigUseCase {
  const configRepository = new PrismaEsocialConfigRepository();
  return new UpdateEsocialConfigUseCase(configRepository);
}
