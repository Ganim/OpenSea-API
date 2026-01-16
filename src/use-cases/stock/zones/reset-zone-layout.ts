import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Zone } from '@/entities/stock/zone';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface ResetZoneLayoutUseCaseRequest {
  zoneId: string;
}

interface ResetZoneLayoutUseCaseResponse {
  zone: Zone;
}

export class ResetZoneLayoutUseCase {
  constructor(private zonesRepository: ZonesRepository) {}

  async execute({
    zoneId,
  }: ResetZoneLayoutUseCaseRequest): Promise<ResetZoneLayoutUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneEntityId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const updatedZone = await this.zonesRepository.updateLayout({
      id: zoneEntityId,
      layout: null,
    });

    if (!updatedZone) {
      throw new ResourceNotFoundError('Zone');
    }

    return { zone: updatedZone };
  }
}
