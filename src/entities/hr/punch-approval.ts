import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Motivos que forçam uma batida de ponto a cair em APPROVAL_REQUIRED
 * (gravada com NSR, mas com `PunchApproval` PENDING criada em paralelo).
 *
 * - `OUT_OF_GEOFENCE` — Fase 4 (geofence fora do raio permitido).
 * - `FACE_MATCH_LOW`  — Fase 5 / Plan 05-07 (biometria facial kiosk: menor
 *                       distância euclidiana ≥ threshold configurado).
 * - `EMPLOYEE_SELF_REQUEST` — Fase 8 / Plan 08-01 (D-07/D-08): funcionário
 *                       antecipa via PWA pessoal a justificativa por uma
 *                       batida esquecida ou pelo upload de atestado médico,
 *                       sem depender do gestor criar a aprovação primeiro.
 * Futuros: `FACE_MATCH_FAIL_3X` (Fase 9 — antifraude),
 *          `CLOCK_DRIFT` (Fase 9 — antifraude),
 *          `MANUAL_CORRECTION` (Fase 6 — compliance Portaria 671).
 */
export type PunchApprovalReason =
  | 'OUT_OF_GEOFENCE'
  | 'FACE_MATCH_LOW'
  | 'EMPLOYEE_SELF_REQUEST';

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

/**
 * Arquivo anexo como evidência de uma aprovação de ponto (Phase 7 / Plan 07-01,
 * D-10). Persistido como `EvidenceFile[]` no JSONB `punch_approvals.evidence_files`.
 *
 * Campos propositadamente restritos: controller de upload (Plan 03) valida via
 * Zod antes de injetar. Nenhum campo livre-form evita T-7-01-01 (tampering).
 * Retention mandatória 5 anos (Portaria 671).
 */
export interface EvidenceFile {
  /** Ex.: "tenant/punch-approvals/{id}/evidence/{uuid}.pdf" (R2 key). */
  storageKey: string;
  filename: string;
  /** Bytes — validado pelo controller (limite mostrado ao usuário). */
  size: number;
  /** ISO 8601 — UTC. */
  uploadedAt: string;
  /** User.id de quem fez o upload (mostrado no drawer do gestor). */
  uploadedBy: string;
}

export interface PunchApprovalProps {
  id: UniqueEntityID;
  tenantId: UniqueEntityID;
  /**
   * Phase 8 / Plan 08-01 (D-07): nullable. Quando o funcionário cria a
   * justificativa via PWA pessoal sem batida prévia (cenário "esqueci de
   * bater"), `proposedTimestamp` + `proposedEntryType` ficam em `details` e
   * `timeEntryId` permanece NULL até o gestor aprovar com correctionPayload.
   * No fluxo Phase 4 (geofence/face-match flagged), continua sendo populada
   * dentro do mesmo `$transaction` da gravação da TimeEntry.
   */
  timeEntryId?: UniqueEntityID | null;
  employeeId: UniqueEntityID;
  reason: PunchApprovalReason;
  details?: Record<string, unknown>;
  status: PunchApprovalStatus;
  resolverUserId?: UniqueEntityID;
  resolvedAt?: Date;
  resolverNote?: string;
  /** Phase 7 / Plan 07-01 — D-10 evidência PDF/documentos anexos. */
  evidenceFiles?: EvidenceFile[];
  /** Phase 7 / Plan 07-01 — D-10 referência cruzada a EmployeeRequest existente. */
  linkedRequestId?: UniqueEntityID | null;
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

  /**
   * Pode ser `null` quando a aprovação é self-create (Phase 8 D-07) sem
   * batida prévia. Callers precisam tratar o caso explicitamente.
   */
  get timeEntryId(): UniqueEntityID | null {
    return this.props.timeEntryId ?? null;
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

  /**
   * Evidências PDF anexadas (D-10). Array vazio quando nenhuma foi anexada.
   */
  get evidenceFiles(): EvidenceFile[] {
    return this.props.evidenceFiles ?? [];
  }

  /**
   * Referência a `EmployeeRequest` existente (atestado aprovado, por exemplo),
   * evitando duplicação de anexos (D-10). `null` quando não linkado.
   */
  get linkedRequestId(): UniqueEntityID | null {
    return this.props.linkedRequestId ?? null;
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

  /**
   * Phase 06 / Plan 06-02 (PUNCH-COMPLIANCE-07).
   *
   * Mescla campos no JSONB `details` da aprovação. Usado pelo
   * `ResolvePunchApprovalUseCase` quando há `correctionPayload`: precisamos
   * gravar `correctionNsr` (e potencialmente `correctionEntryId`) sem perder
   * os campos preexistentes (`distance`, `zoneId`, `faceScore` etc. setados
   * no momento da criação pelo `ExecutePunchUseCase`).
   *
   * `touch()` é invocado automaticamente para que `updatedAt` reflita a
   * mutação (audit trail consistente com `resolve`/`reject`).
   */
  mergeDetails(patch: Record<string, unknown>) {
    this.props.details = { ...(this.props.details ?? {}), ...patch };
    this.touch();
  }

  /**
   * Phase 7 / Plan 07-01 — D-10 evidência.
   *
   * Anexa uma nova evidência (PDF) à aprovação, preservando as anteriores.
   * Uso esperado: após upload via `S3FileUploadService`, o resolve use case
   * injeta o `EvidenceFile` antes (ou durante) `resolve()`/`reject()`. Método
   * dedicado (NÃO reusa `mergeDetails`) porque evidência é de natureza e
   * retenção distinta do correction payload (Portaria 671 exige 5 anos).
   */
  attachEvidence(file: EvidenceFile) {
    this.props.evidenceFiles = [...(this.props.evidenceFiles ?? []), file];
    this.touch();
  }

  /**
   * Phase 7 / Plan 07-01 — D-10 referência cruzada.
   *
   * Liga esta aprovação a um `EmployeeRequest` já aprovado (ex.: atestado
   * médico cuja decisão RH cobre a falta na data). FK nullable com
   * `ON DELETE SET NULL` — se o request for removido, a aprovação permanece
   * mas perde o link (UI mostra "Request removido").
   */
  linkRequest(requestId: string) {
    this.props.linkedRequestId = new UniqueEntityID(requestId);
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
