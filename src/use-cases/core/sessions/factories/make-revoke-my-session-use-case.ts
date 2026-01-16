import { PrismaSessionsRepository } from '@/repositories/core/prisma/prisma-sessions-repository';
import { RevokeMySessionUseCase } from '../revoke-my-session';

export function makeRevokeMySessionUseCase() {
  const sessionsRepository = new PrismaSessionsRepository();
  return new RevokeMySessionUseCase(sessionsRepository);
}
