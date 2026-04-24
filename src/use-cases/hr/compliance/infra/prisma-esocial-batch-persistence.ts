/**
 * Prisma implementation of `EsocialBatchPersistenceService` — Phase 06 / WR-02
 *
 * Encapsula a persistência do `EsocialBatch` + `EsocialEvent[]` gerados
 * pelo use case `BuildS1200ForCompetenciaUseCase`. Mantém a tenant-scope
 * explícita em todas as writes (create com `tenantId`) e trata
 * constraint failures (FK) deixando propagar para o controller/handler de
 * erro global.
 */

import { prisma } from '@/lib/prisma';

import type {
  EsocialBatchPersistenceService,
  PersistS1200BatchInput,
} from '../ports/esocial-batch-persistence';

export class PrismaEsocialBatchPersistenceService implements EsocialBatchPersistenceService {
  async persistS1200Batch(input: PersistS1200BatchInput): Promise<void> {
    await prisma.$transaction(async (tx) => {
      await tx.esocialBatch.create({
        data: {
          id: input.batchId,
          tenantId: input.tenantId,
          status: 'PENDING',
          environment: input.environment,
          totalEvents: input.totalEvents,
          acceptedCount: 0,
          rejectedCount: 0,
          createdBy: input.createdBy,
        },
      });

      if (input.events.length > 0) {
        await tx.esocialEvent.createMany({
          data: input.events.map((ev) => ({
            id: ev.eventId,
            tenantId: input.tenantId,
            eventType: 'S-1200',
            description: `S-1200 ${ev.competencia} — employee ${ev.referenceId}`,
            status: 'DRAFT',
            referenceId: ev.referenceId,
            referenceType: 'employee',
            xmlContent: ev.xmlContent,
            batchId: input.batchId,
            rectifiedEventId: ev.rectifiedEventId ?? null,
          })),
        });
      }
    });
  }
}
