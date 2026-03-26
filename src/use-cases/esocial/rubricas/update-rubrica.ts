import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { EsocialRubrica } from '@/entities/esocial/esocial-rubrica';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EsocialRubricasRepository } from '@/repositories/esocial/esocial-rubricas-repository';

export interface UpdateRubricaRequest {
  tenantId: string;
  rubricaId: string;
  description?: string;
  type?: number;
  incidInss?: string | null;
  incidIrrf?: string | null;
  incidFgts?: string | null;
  isActive?: boolean;
}

export interface UpdateRubricaResponse {
  rubrica: EsocialRubrica;
}

export class UpdateRubricaUseCase {
  constructor(private rubricasRepository: EsocialRubricasRepository) {}

  async execute(
    request: UpdateRubricaRequest,
  ): Promise<UpdateRubricaResponse> {
    const id = new UniqueEntityID(request.rubricaId);

    const existing = await this.rubricasRepository.findById(
      id,
      request.tenantId,
    );

    if (!existing) {
      throw new ResourceNotFoundError('Rubrica not found');
    }

    // Validate type if provided
    if (request.type !== undefined && ![1, 2, 3].includes(request.type)) {
      throw new BadRequestError(
        'Rubrica type must be 1 (Vencimento), 2 (Desconto), or 3 (Informativo)',
      );
    }

    const rubrica = await this.rubricasRepository.update(id, {
      description: request.description,
      type: request.type,
      incidInss: request.incidInss,
      incidIrrf: request.incidIrrf,
      incidFgts: request.incidFgts,
      isActive: request.isActive,
    });

    if (!rubrica) {
      throw new ResourceNotFoundError('Rubrica not found after update');
    }

    return { rubrica };
  }
}
