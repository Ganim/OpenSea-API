import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Tipos de artefato de compliance Portaria 671 (Phase 6 / Plan 06-01).
 *
 * - `AFD`           — Arquivo Fonte de Dados (registro de batidas, layout MTP).
 * - `AFDT`          — AFD Tratado (consolidado com correções aprovadas).
 * - `FOLHA_ESPELHO` — Folha espelho mensal CLT (PDF assinado por funcionário).
 * - `RECIBO`        — Recibo PDF individual de batida (com QR de verificação).
 * - `S1200_XML`     — XML do evento S-1200 submetido ao eSocial.
 *
 * Mantido em sync com `ComplianceArtifactType` no Prisma schema.
 */
export type ComplianceArtifactType =
  | 'AFD'
  | 'AFDT'
  | 'FOLHA_ESPELHO'
  | 'RECIBO'
  | 'S1200_XML';

/**
 * Filtros aplicados na geração do artefato. Estrutura livre (Json) — ex:
 *   { employeeId: 'uuid', departmentIds: ['uuid'], cnpj: '00.000.000/0001-00' }
 *
 * Atenção: pode conter PII; nunca incluir verbatim em audit messages
 * (T-06-01-02). Audit usa apenas IDs/labels agregados.
 */
export type ComplianceArtifactFilters = Record<string, unknown>;

export interface ComplianceArtifactProps {
  tenantId: UniqueEntityID;
  type: ComplianceArtifactType;
  /** Janela do conteúdo (AFD/AFDT/recibo período arbitrário). */
  periodStart?: Date;
  periodEnd?: Date;
  /** Competência YYYY-MM (folha espelho/S1200). Mutuamente exclusivo com period* na prática. */
  competencia?: string;
  filters?: ComplianceArtifactFilters;
  /** Caminho no S3/local storage onde o blob está persistido. */
  storageKey: string;
  /** SHA-256 hex do conteúdo binário gerado (lock contra mutação silenciosa). */
  contentHash: string;
  sizeBytes: number;
  /** UserID do gerador (auditoria — quem assinou a geração). */
  generatedBy: UniqueEntityID;
  generatedAt: Date;
  /** Soft-delete: registro permanece para audit, mas é filtrado nas queries. */
  deletedAt?: Date;
}

/**
 * Entidade de artefato de compliance Portaria 671 (Phase 6 / Plan 06-01).
 *
 * Imutável após criação — exceto pela flag `softDelete()` (RH arquiva sem
 * apagar fisicamente, preservando auditoria de quem gerou e quando). Uma
 * regeração para o mesmo período cria um NOVO `ComplianceArtifact` (não
 * substitui o anterior — o histórico mantém ambos).
 */
export class ComplianceArtifact extends Entity<ComplianceArtifactProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get type() {
    return this.props.type;
  }

  get periodStart() {
    return this.props.periodStart;
  }

  get periodEnd() {
    return this.props.periodEnd;
  }

  get competencia() {
    return this.props.competencia;
  }

  get filters() {
    return this.props.filters;
  }

  get storageKey() {
    return this.props.storageKey;
  }

  get contentHash() {
    return this.props.contentHash;
  }

  get sizeBytes() {
    return this.props.sizeBytes;
  }

  get generatedBy() {
    return this.props.generatedBy;
  }

  get generatedAt() {
    return this.props.generatedAt;
  }

  get deletedAt() {
    return this.props.deletedAt;
  }

  get isDeleted(): boolean {
    return this.props.deletedAt !== undefined;
  }

  /**
   * Marca o artefato como soft-deleted. Idempotente: chamar 2x não muda
   * `deletedAt`. Não há `restore()` neste plano — caso de uso fora do
   * escopo da Phase 6.
   */
  softDelete() {
    if (this.props.deletedAt) {
      return;
    }
    this.props.deletedAt = new Date();
  }

  static create(
    props: Optional<ComplianceArtifactProps, 'generatedAt'>,
    id?: UniqueEntityID,
  ) {
    return new ComplianceArtifact(
      {
        ...props,
        generatedAt: props.generatedAt ?? new Date(),
      },
      id,
    );
  }
}
