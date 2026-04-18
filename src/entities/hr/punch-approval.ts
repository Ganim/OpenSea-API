import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Motivos que forçam uma batida de ponto a cair em APPROVAL_REQUIRED
 * (gravada com NSR, mas com `PunchApproval` PENDING criada em paralelo).
 *
 * Começa com apenas `OUT_OF_GEOFENCE` na Fase 4. Fases futuras adicionam:
 * - `FACE_MATCH_LOW` (Fase 5 — biometria face-api.js)
 * - `FACE_MATCH_FAIL_3X` (Fase 9 — antifraude)
 * - `CLOCK_DRIFT` (Fase 9 — antifraude)
 * - `MANUAL_CORRECTION` (Fase 6 — compliance Portaria 671)
 */
export type PunchApprovalReason = 'OUT_OF_GEOFENCE';

/**
 * Ciclo de vida de uma aprovação de ponto.
 *
 * Transições permitidas:
 * - PENDING → APPROVED (via `resolve(userId, note?)`)
 * - PENDING → REJECTED (via `reject(userId, note?)`)
 *
 * APPROVED e REJECTED são terminais: chamar `resolve` ou `reject` em uma
 * aprovação já resolvida lança erro (Portaria 671 exige preservar audit
 * de cada decisão — correções devem ser feitas criando uma nova batida de
 * correção via `ExecutePunchUseCase`).
 */
export type PunchApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PunchApprovalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  timeEntryId: UniqueEntityID;
  employeeId: UniqueEntityID;
  reason: PunchApprovalReason;
  details?: Record<string, unknown>;
  status: PunchApprovalStatus;
  resolverUserId?: UniqueEntityID;
  resolvedAt?: Date;
  resolverNote?: string;
  createdAt: Date;
  updatedAt?: Date;
}

/**
 * Entidade de domínio para aprovações de ponto (D-06 / D-12).
 *
 * Relação 1:1 com `TimeEntry` (a batida é gravada com NSR imutável; a
 * aprovação é o artefato mutável que o gestor resolve). Nunca deve ser
 * reutilizada para outros fluxos de aprovação (férias/atestado usam
 * `EmployeeRequest` — lifecycle diferente).
 */
export class PunchApproval extends Entity<PunchApprovalProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get timeEntryId() {
    return this.props.timeEntryId;
  }

  get employeeId() {
    return this.props.employeeId;
  }

  get reason() {
    return this.props.reason;
  }

  get details() {
    return this.props.details;
  }

  get status() {
    return this.props.status;
  }

  get resolverUserId() {
    return this.props.resolverUserId;
  }

  get resolvedAt() {
    return this.props.resolvedAt;
  }

  get resolverNote() {
    return this.props.resolverNote;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  get isResolved(): boolean {
    return this.props.status !== 'PENDING';
  }

  /**
   * Aprova a batida. Só pode ser chamado em aprovação PENDING.
   * Aprovação já resolvida lança — para alterar decisão o gestor deve
   * criar uma batida de correção via `ExecutePunchUseCase` (preserva
   * audit trail conforme Portaria 671).
   */
  resolve(resolverUserId: string, note?: string) {
    if (this.isResolved) {
      throw new Error(
        'Aprovação já resolvida; crie nova correção via ExecutePunchUseCase para alterar decisão.',
      );
    }
    this.props.status = 'APPROVED';
    this.props.resolverUserId = new UniqueEntityID(resolverUserId);
    this.props.resolvedAt = new Date();
    this.props.resolverNote = note;
    this.touch();
  }

  /**
   * Rejeita a batida. Só pode ser chamado em aprovação PENDING.
   * Mesma proteção de double-resolve que `resolve()`.
   */
  reject(resolverUserId: string, note?: string) {
    if (this.isResolved) {
      throw new Error(
        'Aprovação já resolvida; crie nova correção via ExecutePunchUseCase para alterar decisão.',
      );
    }
    this.props.status = 'REJECTED';
    this.props.resolverUserId = new UniqueEntityID(resolverUserId);
    this.props.resolvedAt = new Date();
    this.props.resolverNote = note;
    this.touch();
  }

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<PunchApprovalProps, 'id' | 'createdAt' | 'status'>,
    id?: UniqueEntityID,
  ) {
    return new PunchApproval(
      {
        ...props,
        id: props.id ?? new UniqueEntityID(),
        status: props.status ?? 'PENDING',
        createdAt: props.createdAt ?? new Date(),
      },
      id ?? props.id,
    );
  }
}
