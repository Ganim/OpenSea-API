import {
  REQUIRED_COMPLIANCE_CONCEPTS,
  type ComplianceRubricaConcept,
  type ComplianceRubricaMap,
} from '@/entities/hr/compliance-rubrica-map';
import type { ComplianceRubricaMapRepository } from '@/repositories/hr/compliance-rubrica-map-repository';

export interface ListRubricaMapInput {
  tenantId: string;
}

export interface ListRubricaMapOutput {
  items: ComplianceRubricaMap[];
  /**
   * Conceitos OBRIGATÓRIOS para gerar S-1200 que ainda não foram mapeados.
   * UI deve alertar RH; `BuildS1200ForCompetenciaUseCase` também rejeita
   * enquanto algum concept obrigatório estiver em `gaps`.
   */
  gaps: ComplianceRubricaConcept[];
}

/**
 * Lista mapeamentos do tenant + flag `gaps` com conceitos obrigatórios
 * ausentes (HE_50, HE_100, DSR). Usado pela UI /hr/compliance/esocial-rubricas
 * (Plan 06-06) e internamente pelo BuildS1200 (Task 3).
 */
export class ListRubricaMapUseCase {
  constructor(private readonly repo: ComplianceRubricaMapRepository) {}

  async execute(input: ListRubricaMapInput): Promise<ListRubricaMapOutput> {
    const items = await this.repo.findAllByTenant(input.tenantId);

    const configuredConcepts = new Set(items.map((item) => item.clrConcept));
    const gaps = REQUIRED_COMPLIANCE_CONCEPTS.filter(
      (concept) => !configuredConcepts.has(concept),
    );

    return { items, gaps };
  }
}
