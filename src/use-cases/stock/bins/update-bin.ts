import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface UpdateBinUseCaseRequest {
  tenantId: string;
  id: string;
  capacity?: number | null;
  isActive?: boolean;
}

interface UpdateBinUseCaseResponse {
  bin: Bin;
}

export class UpdateBinUseCase {
  constructor(private binsRepository: BinsRepository) {}

  async execute({
    tenantId,
    id,
    capacity,
    isActive,
  }: UpdateBinUseCaseRequest): Promise<UpdateBinUseCaseResponse> {
    const binId = new UniqueEntityID(id);

    const bin = await this.binsRepository.findById(binId, tenantId);

    if (!bin) {
      throw new ResourceNotFoundError('Bin');
    }

    // Validate capacity
    if (capacity !== undefined && capacity !== null) {
      if (capacity < 0) {
        throw new BadRequestError('Capacity cannot be negative.');
      }
      if (bin.currentOccupancy > capacity) {
        throw new BadRequestError(
          `Cannot set capacity to ${capacity}. Current occupancy is ${bin.currentOccupancy}.`,
        );
      }
    }

    const updatedBin = await this.binsRepository.update({
      id: binId,
      capacity,
      isActive,
    });

    if (!updatedBin) {
      throw new ResourceNotFoundError('Bin');
    }

    return { bin: updatedBin };
  }
}
