import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  type ConsortiumDTO,
  consortiumToDTO,
} from '@/mappers/finance/consortium/consortium-to-dto';
import type { ConsortiaRepository } from '@/repositories/finance/consortia-repository';

interface UpdateConsortiumUseCaseRequest {
  tenantId: string;
  id: string;
  name?: string;
  administrator?: string;
  contractNumber?: string | null;
  notes?: string | null;
  endDate?: Date | null;
}

interface UpdateConsortiumUseCaseResponse {
  consortium: ConsortiumDTO;
}

export class UpdateConsortiumUseCase {
  constructor(private consortiaRepository: ConsortiaRepository) {}

  async execute(
    request: UpdateConsortiumUseCaseRequest,
  ): Promise<UpdateConsortiumUseCaseResponse> {
    const { tenantId, id } = request;

    const existingConsortium = await this.consortiaRepository.findById(
      new UniqueEntityID(id),
      tenantId,
    );
    if (!existingConsortium) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    if (existingConsortium.status === 'CANCELLED') {
      throw new BadRequestError('Cannot update a cancelled consortium');
    }

    if (request.name !== undefined && request.name.trim().length === 0) {
      throw new BadRequestError('Consortium name cannot be empty');
    }

    const updated = await this.consortiaRepository.update({
      id: new UniqueEntityID(id),
      name: request.name?.trim(),
      administrator: request.administrator?.trim(),
      contractNumber: request.contractNumber,
      notes: request.notes,
      endDate: request.endDate,
    });

    if (!updated) {
      throw new ResourceNotFoundError('Consortium not found');
    }

    return { consortium: consortiumToDTO(updated) };
  }
}
