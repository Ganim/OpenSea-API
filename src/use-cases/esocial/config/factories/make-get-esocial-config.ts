import { PrismaEsocialConfigRepository } from '@/repositories/esocial/prisma/prisma-esocial-config-repository';
import { GetEsocialConfigUseCase } from '../get-esocial-config';

export function makeGetEsocialConfigUseCase(): GetEsocialConfigUseCase {
  const configRepository = new PrismaEsocialConfigRepository();
  return new GetEsocialConfigUseCase(configRepository);
}
