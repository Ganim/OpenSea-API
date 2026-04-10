import { PrismaPosPrintersRepository } from '@/repositories/sales/prisma/prisma-pos-printers-repository';
import { SyncAgentPrintersUseCase } from '../sync-agent-printers.use-case';

export function makeSyncAgentPrintersUseCase() {
  return new SyncAgentPrintersUseCase(new PrismaPosPrintersRepository());
}
