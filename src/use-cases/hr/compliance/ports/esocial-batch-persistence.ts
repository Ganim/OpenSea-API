/**
 * Port (Clean Architecture) — Phase 06 / WR-02
 *
 * Abstração mínima consumida pelo `BuildS1200ForCompetenciaUseCase` para
 * persistir o `EsocialBatch` + eventos `S-1200` gerados, evitando que o
 * use-case (ou o controller) conheça detalhes do Prisma.
 *
 * Mantida em `ports/` para sinalizar que se trata de um contrato de
 * saída — a implementação concreta fica em `infra/` (Prisma) e um fake
 * in-memory é fornecido para testes unitários.
 */

export interface PersistS1200BatchInput {
  batchId: string;
  tenantId: string;
  createdBy: string;
  environment: 'HOMOLOGACAO' | 'PRODUCAO';
  totalEvents: number;
  events: Array<{
    eventId: string;
    referenceId: string;
    xmlContent: string;
    competencia: string;
    rectifiedEventId?: string;
  }>;
}

export interface EsocialBatchPersistenceService {
  persistS1200Batch(input: PersistS1200BatchInput): Promise<void>;
}
