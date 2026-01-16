import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import type { BinsRepository } from '@/repositories/stock/bins-repository';

interface DeleteZoneUseCaseRequest {
  id: string;
  forceDeleteBins?: boolean;
}

interface DeleteZoneUseCaseResponse {
  success: boolean;
  deletedBinsCount: number;
}

export class DeleteZoneUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private binsRepository: BinsRepository,
  ) {}

  async execute({
    id,
    forceDeleteBins = false,
  }: DeleteZoneUseCaseRequest): Promise<DeleteZoneUseCaseResponse> {
    const zoneId = new UniqueEntityID(id);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    // Check if zone has bins
    const binCount = await this.zonesRepository.countBins(zoneId);

    if (binCount > 0 && !forceDeleteBins) {
      throw new BadRequestError(
        `Zone has ${binCount} bin(s). Use forceDeleteBins=true to delete all bins.`,
      );
    }

    let deletedBinsCount = 0;

    // Delete bins if force flag is set
    if (binCount > 0 && forceDeleteBins) {
      deletedBinsCount = await this.binsRepository.deleteByZone(zoneId);
    }

    // Delete zone
    await this.zonesRepository.delete(zoneId);

    return { success: true, deletedBinsCount };
  }
}
