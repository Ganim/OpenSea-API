import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ConsortiumDTO,
  consortiumToDTO,
} from '@/mappers/finance/consortium/consortium-to-dto';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';

interface MarkContemplatedUseCaseRequest {
  tenantId: string;
  id: string;
  contemplationType: string; // BID | DRAW
  contemplatedAt: Date;
}

interface MarkContemplatedUseCaseResponse {
  consortium: ConsortiumDTO;
}

export class MarkContemplatedUseCase {
  constructor(private consortiaRepository: ConsortiaRepository) {}

  async execute(
    request: MarkContemplatedUseCaseRequest,
  ): Promise<MarkContemplatedUseCaseResponse> {
    const { tenantId, id, contemplationType, contemplatedAt } = request;

    const consortium = await this.consortiaRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );

    if (!consortium) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    if (consortium.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Only active consortia can be marked as contemplated',
      );
    }

    if (consortium.isContemplated) {
      throw new BadRequestError('Consortium is already contemplated');
    }

    const updated = await this.consortiaRepository.update({
      id: new UniqueEntityID(id),
      isContemplated: true,
      contemplatedAt,
      contemplationType,
      status: 'CONTEMPLATED',
    });

    if (!updated) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    return { consortium: consortiumToDTO(updated) };
  }
}
