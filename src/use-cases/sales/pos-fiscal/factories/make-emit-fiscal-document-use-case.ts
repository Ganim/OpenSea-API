import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPosFiscalConfigsRepository } from '@/repositories/sales/prisma/prisma-pos-fiscal-configs-repository';
import { MockedFiscalSefazService } from '@/services/fiscal/mocked-fiscal-sefaz-service';

import { EmitFiscalDocumentUseCase } from '../emit-fiscal-document';

/**
 * Factory for `EmitFiscalDocumentUseCase` (Emporion Plan A — Task 32).
 *
 * Wires the production Prisma repositories with the in-process
 * {@link MockedFiscalSefazService}. The mocked service is the live Fase 1
 * implementation: a real SEFAZ provider implementing the same
 * `FiscalSefazService` interface can drop in here without touching the
 * use case or controller.
 */
export function makeEmitFiscalDocumentUseCase(): EmitFiscalDocumentUseCase {
  return new EmitFiscalDocumentUseCase(
    new PrismaOrdersRepository(),
    new PrismaPosFiscalConfigsRepository(),
    new MockedFiscalSefazService(),
  );
}
