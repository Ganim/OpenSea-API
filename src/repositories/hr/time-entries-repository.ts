import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TimeEntry } from '@/entities/hr/time-entry';
import type { TimeEntryType } from '@/entities/hr/value-objects';

export interface CreateTimeEntrySchema {
  tenantId: string;
  employeeId: UniqueEntityID;
  entryType: TimeEntryType;
  timestamp: Date;
  latitude?: number;
  longitude?: number;
  ipAddress?: string;
  notes?: string;
  nsrNumber?: number;
  /**
   * Idempotency key scoped by (tenantId, employeeId, requestId).
   * Added in Plan 04-04 (D-11). When set, the DB-level composite unique
   * constraint `time_entries_idempotency_unique` ensures a retried
   * request with the same triple resolves to the existing row rather
   * than a duplicate punch.
   */
  requestId?: string;
  /**
   * Opaque audit payload (D-04 / Plan 05-07). Currently carries liveness
   * metadata emitted by the kiosk. Persisted as-is; never queried back
   * in Phase 5.
   */
  metadata?: Record<string, unknown> | null;
}

export interface FindTimeEntriesFilters {
  tenantId: string;
  employeeId?: UniqueEntityID;
  startDate?: Date;
  endDate?: Date;
  entryType?: TimeEntryType;
  page?: number;
  perPage?: number;
}

export interface FindManyTimeEntriesResult {
  timeEntries: TimeEntry[];
  total: number;
}

/**
 * Payload para criar uma batida de CORREÇÃO (Phase 06 / Plan 06-02).
 *
 * Diferente de `CreateTimeEntrySchema`: aqui o NSR é alocado SEMPRE pelo
 * próprio repositório (não aceita do caller — invariante PUNCH-COMPLIANCE-07
 * exige NSR sequencial novo); a entrada original é referenciada via
 * `originEntryId` para que o repo escreva `originNsrNumber` na nova linha.
 *
 * **Imutabilidade da origem:** o `TimeEntry` original NUNCA é modificado por
 * este método — apenas uma nova linha é inserida com `adjustmentType =
 * ADJUSTMENT_APPROVED`. Quem invocar este método (ex:
 * `ResolvePunchApprovalUseCase` após `correctionPayload`) pode confiar que
 * os campos NSR/timestamp/payload da batida original permanecem intactos.
 */
export interface CreateTimeEntryAdjustmentParams {
  /** ID do TimeEntry original que está sendo corrigido (NSR fica preservado). */
  originEntryId: string;
  /** Tenant scope — repo guard rejeita se a origem não pertence ao tenant. */
  tenantId: string;
  /** Funcionário associado à batida corrigida (geralmente == origem). */
  employeeId: UniqueEntityID;
  /** Tipo de batida corrigido (gestor pode mudar IN→OUT etc). */
  entryType: TimeEntryType;
  /** Timestamp final corrigido. */
  timestamp: Date;
  /** Nota livre do gestor sobre a correção (vai parar em TimeEntry.notes). */
  note?: string;
  /** UserID do gestor que aprovou a correção (audit trail). */
  resolverUserId: string;
  /**
   * Idempotency token opcional — se a tela do gestor enviar o mesmo
   * token duas vezes, o repo retorna a entry já criada em vez de duplicar.
   */
  requestId?: string;
}

/**
 * Resultado de `createAdjustment`. Inclui o `nsrNumber` recém-alocado
 * (fica visível para o caller pode escrever em `PunchApproval.details.correctionNsr`).
 */
export interface CreateTimeEntryAdjustmentResult {
  timeEntry: TimeEntry;
  nsrNumber: number;
  originNsrNumber: number;
}

/**
 * Projeção flat retornada por `findByReceiptVerifyHash` (Phase 06 / Plan 06-03).
 *
 * A entity `TimeEntry` não carrega `nsrNumber` nem `receiptVerifyHash`
 * (campos adicionados em Plan 06-01 via sidecar). Para a rota pública de
 * consulta de recibo, o use case precisa de TODOS esses campos em uma única
 * ida ao banco — retornamos um DTO plano em vez de widenar a entity.
 *
 * Inclui `approvalStatus` para o mapper LGPD decidir entre "Registrado" (APPROVED)
 * e "Aguardando aprovação do gestor" (PENDING). Null quando não há PunchApproval
 * vinculado (batida aceita na captura) — mesma semântica que APPROVED para o
 * público.
 */
export interface TimeEntryForReceiptLookup {
  id: string;
  tenantId: string;
  employeeId: string;
  entryType: 'CLOCK_IN' | 'CLOCK_OUT' | 'BREAK_START' | 'BREAK_END';
  timestamp: Date;
  nsrNumber: number;
  /** 'PENDING' quando há aprovação pendente; null quando aceita na captura. */
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
}

/**
 * Update usada pelo receipt-pdf-worker (Plan 06-03) para marcar a batida
 * como já-tendo-recibo. Guard de tenant evita atualizar cross-tenant.
 */
export interface UpdateReceiptMetadataParams {
  timeEntryId: string;
  tenantId: string;
  receiptUrl: string;
  receiptVerifyHash: string;
}

export interface TimeEntriesRepository {
  create(data: CreateTimeEntrySchema): Promise<TimeEntry>;
  /**
   * Creates a TimeEntry with a sequential NSR number, retrying on unique
   * constraint violation (@@unique([tenantId, nsrNumber])) to handle
   * concurrent punches safely. Required by Portaria 671 Anexo III — NSR
   * duplicates invalidate the AFD.
   *
   * Returns both the entity and the allocated NSR — the entity itself does
   * not carry `nsrNumber` (it lives in the DB column only), so callers
   * that need to surface NSR in their response (e.g. ExecutePunchUseCase)
   * read it from this tuple.
   */
  createWithSequentialNsr(
    data: Omit<CreateTimeEntrySchema, 'nsrNumber'>,
  ): Promise<{ timeEntry: TimeEntry; nsrNumber: number }>;
  findById(id: UniqueEntityID, tenantId: string): Promise<TimeEntry | null>;
  findMany(filters: FindTimeEntriesFilters): Promise<FindManyTimeEntriesResult>;
  findManyByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry[]>;
  findManyByEmployeeAndDateRange(
    employeeId: UniqueEntityID,
    startDate: Date,
    endDate: Date,
    tenantId: string,
  ): Promise<TimeEntry[]>;
  findLastEntryByEmployee(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<TimeEntry | null>;
  /**
   * Idempotency lookup added in Plan 04-04 (D-11 / Pitfall 3). Must use
   * `findFirst` (NOT findUnique) because `requestId` is nullable —
   * findUnique would mistreat the (tenantId, employeeId, null) triple
   * as a match when no request_id is set on historical rows.
   *
   * Returns null when no prior batida carries this requestId, allowing
   * the use case to proceed with a fresh insert.
   */
  findByRequestId(
    tenantId: string,
    employeeId: string,
    requestId: string,
  ): Promise<{ timeEntry: TimeEntry; nsrNumber: number } | null>;
  delete(id: UniqueEntityID, tenantId?: string): Promise<void>;
  findMaxNsrNumber(tenantId: string): Promise<number>;
  /**
   * Phase 06 / Plan 06-02 (PUNCH-COMPLIANCE-07).
   *
   * Cria uma BATIDA DE CORREÇÃO ligada a `originEntryId`, alocando um NSR
   * sequencial novo dentro do tenant. A batida original NÃO é modificada
   * (invariante crítica para AFD não ser invalidado: NSR é imutável depois
   * de gravado). A nova entry carrega:
   *
   * - `nsrNumber`        → novo, sequencial
   * - `originNsrNumber`  → NSR da batida original (FK lógica para AFDT)
   * - `adjustmentType`   → ADJUSTMENT_APPROVED
   * - `timestamp`        → valor corrigido pelo gestor
   * - `entryType`        → valor corrigido pelo gestor
   * - `notes`            → nota do gestor (opcional)
   *
   * Retorna a entity nova + ambos os NSRs (origem e correção) para o caller
   * usar em `PunchApproval.details.correctionNsr` e nos eventos PUNCH_EVENTS.
   */
  createAdjustment(
    params: CreateTimeEntryAdjustmentParams,
  ): Promise<CreateTimeEntryAdjustmentResult>;

  /**
   * Phase 06 / Plan 06-03 (PUNCH-COMPLIANCE-04).
   *
   * Procura a batida cujo HMAC público (`receipt_verify_hash`) bate com o
   * hash informado pela rota pública `/v1/public/punch/verify/:nsrHash`.
   *
   * **Pitfall 8:** usar `findFirst` (NÃO `findUnique`). Embora
   * `receipt_verify_hash` tenha constraint @unique no schema, linhas
   * legadas carregam NULL (batidas criadas ANTES do worker do Plan 06-03);
   * `findUnique` em coluna nullable emite warning e o shape `{nsrHash}` fica
   * ambíguo quando o parâmetro não existe. `findFirst` com WHERE explícito é
   * robusto a ambos os cenários.
   *
   * Retorna `null` quando não existe batida com esse hash. Use case loga
   * `compliance_public_verify_log(hitResult='NOT_FOUND')` e responde 404.
   *
   * A busca é deliberadamente SEM escopo de tenant: o hash é HMAC com secret
   * único global, então descobrir-o-hash é equivalente a conhecer a batida.
   * Tenant é resolvido a partir da própria linha encontrada.
   */
  findByReceiptVerifyHash(
    nsrHash: string,
  ): Promise<TimeEntryForReceiptLookup | null>;

  /**
   * Phase 06 / Plan 06-03 — atualiza `receipt_generated=true`, `receipt_url`
   * e `receipt_verify_hash` depois de o worker persistir o PDF no R2.
   *
   * Guard de tenant via `updateMany` — se o id não bater com o tenant, zero
   * rows afetadas (silenciosamente no-op, mesmo semântica de `softDelete` em
   * outros repos Phase 6).
   */
  updateReceiptMetadata(params: UpdateReceiptMetadataParams): Promise<void>;

  /**
   * Phase 07 / Plan 07-05a — retorna `true` quando houve ao menos uma batida
   * do funcionário no dia UTC de `date` (comparação contra startOfDay/endOfDay
   * do dia em UTC). Consumido pelo `DetectMissedPunchesUseCase` para skipar
   * funcionários que já bateram.
   */
  existsOnDate(
    employeeId: string,
    tenantId: string,
    date: Date,
  ): Promise<boolean>;
}
