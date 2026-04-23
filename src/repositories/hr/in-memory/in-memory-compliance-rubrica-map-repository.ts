import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  COMPLIANCE_RUBRICA_CONCEPTS,
  ComplianceRubricaMap,
  type ComplianceRubricaConcept,
} from '@/entities/hr/compliance-rubrica-map';

import type {
  ComplianceRubricaMapRepository,
  UpsertComplianceRubricaMapParams,
  UpsertComplianceRubricaMapResult,
} from '../compliance-rubrica-map-repository';

export class InMemoryComplianceRubricaMapRepository implements ComplianceRubricaMapRepository {
  public items: ComplianceRubricaMap[] = [];

  async findAllByTenant(tenantId: string): Promise<ComplianceRubricaMap[]> {
    return this.items
      .filter((item) => item.tenantId.toString() === tenantId)
      .sort(
        (a, b) =>
          COMPLIANCE_RUBRICA_CONCEPTS.indexOf(a.clrConcept) -
          COMPLIANCE_RUBRICA_CONCEPTS.indexOf(b.clrConcept),
      );
  }

  async findByTenantAndConcept(
    tenantId: string,
    clrConcept: ComplianceRubricaConcept,
  ): Promise<ComplianceRubricaMap | null> {
    return (
      this.items.find(
        (item) =>
          item.tenantId.toString() === tenantId &&
          item.clrConcept === clrConcept,
      ) ?? null
    );
  }

  async upsert(
    params: UpsertComplianceRubricaMapParams,
  ): Promise<UpsertComplianceRubricaMapResult> {
    const updatedBy =
      typeof params.updatedBy === 'string'
        ? new UniqueEntityID(params.updatedBy)
        : params.updatedBy;

    const existing = this.items.find(
      (item) =>
        item.tenantId.toString() === params.tenantId &&
        item.clrConcept === params.clrConcept,
    );

    if (existing) {
      existing.update({
        codRubr: params.codRubr,
        ideTabRubr: params.ideTabRubr,
        indApurIR: params.indApurIR,
        updatedBy,
      });
      return { rubricaMap: existing, created: false };
    }

    const rubricaMap = ComplianceRubricaMap.create({
      tenantId: new UniqueEntityID(params.tenantId),
      clrConcept: params.clrConcept,
      codRubr: params.codRubr,
      ideTabRubr: params.ideTabRubr,
      indApurIR: params.indApurIR,
      updatedBy,
    });

    this.items.push(rubricaMap);
    return { rubricaMap, created: true };
  }
}
