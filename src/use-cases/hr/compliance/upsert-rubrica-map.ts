import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  COMPLIANCE_RUBRICA_CONCEPTS,
  type ComplianceRubricaConcept,
  type ComplianceRubricaMap,
} from '@/entities/hr/compliance-rubrica-map';
import type { ComplianceRubricaMapRepository } from '@/repositories/hr/compliance-rubrica-map-repository';

export interface UpsertRubricaMapInput {
  tenantId: string;
  clrConcept: ComplianceRubricaConcept;
  codRubr: string;
  ideTabRubr: string;
  indApurIR?: number;
  updatedBy: string | UniqueEntityID;
}

export interface UpsertRubricaMapOutput {
  rubricaMap: ComplianceRubricaMap;
  created: boolean;
}

/**
 * Upsert de um mapeamento CLT concept → eSocial codRubr para um tenant.
 *
 * Tenant-scoped. Valida concept + codRubr/ideTabRubr tamanho. Retorna flag
 * `created` para o controller emitir 201 vs 200. Audit log (COMPLIANCE_RUBRICA_UPSERTED)
 * é responsabilidade do controller — use case apenas toca DB.
 */
export class UpsertRubricaMapUseCase {
  constructor(private readonly repo: ComplianceRubricaMapRepository) {}

  async execute(input: UpsertRubricaMapInput): Promise<UpsertRubricaMapOutput> {
    if (!COMPLIANCE_RUBRICA_CONCEPTS.includes(input.clrConcept)) {
      throw new BadRequestError(
        `Conceito inválido: ${input.clrConcept}. Valores aceitos: ${COMPLIANCE_RUBRICA_CONCEPTS.join(', ')}`,
      );
    }
    if (input.codRubr.length === 0 || input.codRubr.length > 16) {
      throw new BadRequestError('codRubr deve ter entre 1 e 16 caracteres');
    }
    if (input.ideTabRubr.length === 0 || input.ideTabRubr.length > 16) {
      throw new BadRequestError('ideTabRubr deve ter entre 1 e 16 caracteres');
    }
    if (
      input.indApurIR !== undefined &&
      input.indApurIR !== 0 &&
      input.indApurIR !== 1
    ) {
      throw new BadRequestError('indApurIR deve ser 0 (normal) ou 1 (13o)');
    }

    return this.repo.upsert({
      tenantId: input.tenantId,
      clrConcept: input.clrConcept,
      codRubr: input.codRubr,
      ideTabRubr: input.ideTabRubr,
      indApurIR: input.indApurIR,
      updatedBy: input.updatedBy,
    });
  }
}
