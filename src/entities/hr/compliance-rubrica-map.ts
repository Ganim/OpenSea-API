import { Entity } from '../domain/entities';
import type { Optional } from '../domain/optional';
import { UniqueEntityID } from '../domain/unique-entity-id';

/**
 * Conceitos CLT que precisam mapear para `codRubr` eSocial via
 * `ComplianceRubricaMap`.
 *
 * Plan 06-05 (A5 gap investigação): `EsocialRubrica` existente é CRUD genérico
 * sem semântica CLT. Este enum é a ponte que o `BuildS1200ForCompetenciaUseCase`
 * usa para traduzir totais consolidados (HE/DSR/FERIAS) em `S1200ItemRemun`.
 *
 * Conceitos obrigatórios (gap se ausente): HE_50, HE_100, DSR.
 * Conceitos recomendados (warning se ausente): FERIAS, FALTA_JUSTIFICADA, SALARIO_BASE.
 */
export const COMPLIANCE_RUBRICA_CONCEPTS = [
  'HE_50',
  'HE_100',
  'DSR',
  'FERIAS',
  'FALTA_JUSTIFICADA',
  'SALARIO_BASE',
] as const;

export type ComplianceRubricaConcept =
  (typeof COMPLIANCE_RUBRICA_CONCEPTS)[number];

/**
 * Conceitos obrigatórios para gerar S-1200 mensal. Se faltar qualquer um deles,
 * o `BuildS1200ForCompetenciaUseCase` rejeita a submissão com 400.
 */
export const REQUIRED_COMPLIANCE_CONCEPTS: ComplianceRubricaConcept[] = [
  'HE_50',
  'HE_100',
  'DSR',
];

export interface ComplianceRubricaMapProps {
  tenantId: UniqueEntityID;
  clrConcept: ComplianceRubricaConcept;
  /** Código da rubrica eSocial (Tabela S-1010). Max 16 chars. */
  codRubr: string;
  /** Identificador da tabela de rubricas do tenant. Max 16 chars. */
  ideTabRubr: string;
  /**
   * Indicativo de apuração de IR (0=Normal, 1=Décimo terceiro). Opcional —
   * default do governo é 0 quando não informado.
   */
  indApurIR?: number;
  createdAt: Date;
  updatedAt: Date;
  /** UserID do último editor (auditoria — quem configurou a rubrica). */
  updatedBy: UniqueEntityID;
}

/**
 * Entidade de mapeamento CLT concept → eSocial codRubr (Phase 6 / Plan 06-05).
 *
 * Tenant-scoped: `@@unique([tenantId, clrConcept])`. Cada tenant define
 * exatamente UMA rubrica por conceito — upsert sobrescreve a anterior
 * (auditoria via `updatedBy` + audit log).
 */
export class ComplianceRubricaMap extends Entity<ComplianceRubricaMapProps> {
  get tenantId() {
    return this.props.tenantId;
  }

  get clrConcept() {
    return this.props.clrConcept;
  }

  get codRubr() {
    return this.props.codRubr;
  }

  get ideTabRubr() {
    return this.props.ideTabRubr;
  }

  get indApurIR() {
    return this.props.indApurIR;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get updatedBy() {
    return this.props.updatedBy;
  }

  /**
   * Atualiza codRubr/ideTabRubr/indApurIR preservando imutabilidade de
   * tenantId/clrConcept. Usado pelo `UpsertRubricaMapUseCase`.
   */
  update(params: {
    codRubr: string;
    ideTabRubr: string;
    indApurIR?: number;
    updatedBy: UniqueEntityID;
  }) {
    if (params.codRubr.length === 0 || params.codRubr.length > 16) {
      throw new Error('codRubr must be 1..16 chars');
    }
    if (params.ideTabRubr.length === 0 || params.ideTabRubr.length > 16) {
      throw new Error('ideTabRubr must be 1..16 chars');
    }
    if (
      params.indApurIR !== undefined &&
      params.indApurIR !== 0 &&
      params.indApurIR !== 1
    ) {
      throw new Error('indApurIR must be 0 or 1');
    }
    this.props.codRubr = params.codRubr;
    this.props.ideTabRubr = params.ideTabRubr;
    this.props.indApurIR = params.indApurIR;
    this.props.updatedBy = params.updatedBy;
    this.props.updatedAt = new Date();
  }

  static create(
    props: Optional<ComplianceRubricaMapProps, 'createdAt' | 'updatedAt'>,
    id?: UniqueEntityID,
  ) {
    if (!COMPLIANCE_RUBRICA_CONCEPTS.includes(props.clrConcept)) {
      throw new Error(`Invalid clrConcept: ${props.clrConcept}`);
    }
    if (props.codRubr.length === 0 || props.codRubr.length > 16) {
      throw new Error('codRubr must be 1..16 chars');
    }
    if (props.ideTabRubr.length === 0 || props.ideTabRubr.length > 16) {
      throw new Error('ideTabRubr must be 1..16 chars');
    }
    if (
      props.indApurIR !== undefined &&
      props.indApurIR !== 0 &&
      props.indApurIR !== 1
    ) {
      throw new Error('indApurIR must be 0 or 1');
    }

    const now = new Date();
    return new ComplianceRubricaMap(
      {
        ...props,
        createdAt: props.createdAt ?? now,
        updatedAt: props.updatedAt ?? now,
      },
      id,
    );
  }
}
