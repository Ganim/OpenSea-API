import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Tipos de resolução de uma batida faltante (Phase 7 / Plan 07-01, D-12).
 *
 * - `LATE_PUNCH` — funcionário bateu depois da data (recuperação via ponto
 *   mobile/kiosk no dia seguinte). Phase 9 feature: em Phase 7 nenhum use case
 *   seta este valor; campo permanece `null`.
 * - `MANUAL_ADJUSTMENT` — RH ajustou manualmente via fluxo de correção (eventual
 *   integração com `ResolvePunchApprovalUseCase` via correctionPayload).
 * - `JUSTIFIED_LEAVE` — posteriormente descoberto que havia `Vacation`/`Absence`/
 *   `Holiday` ativo naquela data (o scheduler filtra ativamente, mas licenças
 *   aprovadas depois de 22h ficam como faltante e precisam ser resolvidas).
 * - `IGNORED` — gestor explicitamente marcou como ignorado (sem follow-up).
 */
export type PunchMissedLogResolutionType =
  | 'LATE_PUNCH'
  | 'MANUAL_ADJUSTMENT'
  | 'JUSTIFIED_LEAVE'
  | 'IGNORED';

export interface PunchMissedLogProps {
  tenantId: UniqueEntityID;
  employeeId: UniqueEntityID;
  /** Data de referência (apenas YYYY-MM-DD — persistido como DATE no Postgres). */
  date: Date;
  shiftAssignmentId?: UniqueEntityID | null;
  /** Horário esperado de início no dia, extraído do Shift associado. */
  expectedStartTime?: Date | null;
  /** Horário esperado de fim no dia, extraído do Shift associado. */
  expectedEndTime?: Date | null;
  /** Defaults to `new Date()` via `create()` factory quando omitido. */
  generatedAt: Date;
  /** BullMQ jobId que detectou esta falta (trace reverso da origem). */
  generatedByJobId?: string | null;
  resolvedAt?: Date | null;
  resolutionType?: PunchMissedLogResolutionType | null;
}

/**
 * Entidade de domínio para batidas faltantes detectadas pelo scheduler
 * `detect-missed-punches` (22h timezone-tenant, Phase 7 / Plan 07-01, D-12).
 *
 * Uma linha por (tenantId, employeeId, date) — UNIQUE no Prisma schema garante
 * idempotência frente a reruns do scheduler. Defesa em profundidade: o próprio
 * scheduler faz `SETNX` em Redis antes de chamar o job (Pitfall 3), e o worker
 * dá `skipDuplicates` ao inserir em lote; UNIQUE é a última linha de defesa.
 *
 * Campos `resolvedAt` + `resolutionType` são forward-compatible com Phase 9
 * (recuperação manual / ajuste via ResolvePunchApproval). Em Phase 7 permanecem
 * `null` em todas as escritas; leituras tratam `isResolved` como derivado.
 */
export class PunchMissedLog extends Entity<PunchMissedLogProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get employeeId() {
    return this.props.employeeId;
  }

  get date() {
    return this.props.date;
  }

  get shiftAssignmentId() {
    return this.props.shiftAssignmentId ?? null;
  }

  get expectedStartTime() {
    return this.props.expectedStartTime ?? null;
  }

  get expectedEndTime() {
    return this.props.expectedEndTime ?? null;
  }

  get generatedAt() {
    return this.props.generatedAt;
  }

  get generatedByJobId() {
    return this.props.generatedByJobId ?? null;
  }

  get resolvedAt() {
    return this.props.resolvedAt ?? null;
  }

  get resolutionType() {
    return this.props.resolutionType ?? null;
  }

  get isResolved(): boolean {
    return this.props.resolvedAt != null;
  }

  /**
   * Marca esta falta como resolvida (Phase 9 feature). Double-resolve é
   * idempotente: sobrescreve `resolvedAt` e `resolutionType` para permitir
   * correção de erro de classificação por parte do RH.
   */
  markResolved(type: PunchMissedLogResolutionType) {
    this.props.resolvedAt = new Date();
    this.props.resolutionType = type;
  }

  static create(
    props: Optional<PunchMissedLogProps, 'generatedAt'>,
    id?: UniqueEntityID,
  ): PunchMissedLog {
    return new PunchMissedLog(
      {
        ...props,
        generatedAt: props.generatedAt ?? new Date(),
      },
      id,
    );
  }
}
