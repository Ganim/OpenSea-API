import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialRubrica } from '@/entities/esocial/esocial-rubrica';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';

export interface CreateRubricaRequest {
  tenantId: string;
  code: string;
  description: string;
  type: number;
  incidInss?: string;
  incidIrrf?: string;
  incidFgts?: string;
  isActive?: boolean;
}

export interface CreateRubricaResponse {
  rubrica: EsocialRubrica;
}

export class CreateRubricaUseCase {
  constructor(private rubricasRepository: EsocialRubricasRepository) {}

  async execute(
    request: CreateRubricaRequest,
  ): Promise<CreateRubricaResponse> {
    // Validate type
    if (![1, 2, 3].includes(request.type)) {
      throw new BadRequestError(
        'Rubrica type must be 1 (Vencimento), 2 (Desconto), or 3 (Informativo)',
      );
    }

    // Check for duplicate code
    const existing = await this.rubricasRepository.findByCode(
      request.code,
      request.tenantId,
    );

    if (existing) {
      throw new ConflictError(
        `Rubrica with code '${request.code}' already exists`,
      );
    }

    const rubrica = await this.rubricasRepository.create({
      tenantId: request.tenantId,
      code: request.code,
      description: request.description,
      type: request.type,
      incidInss: request.incidInss,
      incidIrrf: request.incidIrrf,
      incidFgts: request.incidFgts,
      isActive: request.isActive,
    });

    return { rubrica };
  }
}
