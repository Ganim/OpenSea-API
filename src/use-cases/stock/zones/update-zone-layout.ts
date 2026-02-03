import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ZoneLayoutProps } from '@/entities/stock/value-objects/zone-layout';
import type { Zone } from '@/entities/stock/zone';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface UpdateZoneLayoutUseCaseRequest {
  tenantId: string;
  zoneId: string;
  layout: ZoneLayoutProps | null;
}

interface UpdateZoneLayoutUseCaseResponse {
  zone: Zone;
}

export class UpdateZoneLayoutUseCase {
  constructor(private zonesRepository: ZonesRepository) {}

  async execute({
    tenantId,
    zoneId,
    layout,
  }: UpdateZoneLayoutUseCaseRequest): Promise<UpdateZoneLayoutUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    // Check if zone exists
    const zone = await this.zonesRepository.findById(zoneEntityId, tenantId);

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const updatedZone = await this.zonesRepository.updateLayout({
      id: zoneEntityId,
      layout,
    });

    if (!updatedZone) {
      throw new ResourceNotFoundError('Zone');
    }

    return { zone: updatedZone };
  }
}
