import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Bin } from '@/entities/stock/bin';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface ListAvailableBinsUseCaseRequest {
  zoneId: string;
}

interface ListAvailableBinsUseCaseResponse {
  bins: Bin[];
}

export class ListAvailableBinsUseCase {
  constructor(
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
  ) {}

  async execute({
    zoneId,
  }: ListAvailableBinsUseCaseRequest): Promise<ListAvailableBinsUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneEntityId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const bins = await this.binsRepository.findManyAvailable(zoneEntityId);

    return { bins };
  }
}
