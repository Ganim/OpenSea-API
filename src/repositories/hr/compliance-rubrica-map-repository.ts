import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ComplianceRubricaConcept,
  ComplianceRubricaMap,
} from '@/entities/hr/compliance-rubrica-map';

export interface UpsertComplianceRubricaMapParams {
  tenantId: string;
  clrConcept: ComplianceRubricaConcept;
  codRubr: string;
  ideTabRubr: string;
  indApurIR?: number;
  updatedBy: UniqueEntityID | string;
}

export interface UpsertComplianceRubricaMapResult {
  rubricaMap: ComplianceRubricaMap;
  created: boolean;
}

export interface ComplianceRubricaMapRepository {
  /** Lista todos os mappings do tenant ordenados por concept. */
  findAllByTenant(tenantId: string): Promise<ComplianceRubricaMap[]>;

  /** Retorna o mapping de um concept específico, ou null se não configurado. */
  findByTenantAndConcept(
    tenantId: string,
    clrConcept: ComplianceRubricaConcept,
  ): Promise<ComplianceRubricaMap | null>;

  /**
   * Upsert tenant-scoped: cria se não existir, atualiza senão. Retorna o
   * mapping final + flag `created` (útil para 201 vs 200 no controller).
   */
  upsert(
    params: UpsertComplianceRubricaMapParams,
  ): Promise<UpsertComplianceRubricaMapResult>;
}
