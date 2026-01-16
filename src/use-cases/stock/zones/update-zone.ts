import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Zone } from '@/entities/stock/zone';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface UpdateZoneUseCaseRequest {
  id: string;
  code?: string;
  name?: string;
  description?: string | null;
  isActive?: boolean;
}

interface UpdateZoneUseCaseResponse {
  zone: Zone;
}

export class UpdateZoneUseCase {
  constructor(private zonesRepository: ZonesRepository) {}

  async execute({
    id,
    code,
    name,
    description,
    isActive,
  }: UpdateZoneUseCaseRequest): Promise<UpdateZoneUseCaseResponse> {
    const zoneId = new UniqueEntityID(id);

    // Check if zone exists
    const existingZone = await this.zonesRepository.findById(zoneId);

    if (!existingZone) {
      throw new ResourceNotFoundError('Zone');
    }

    // Validate code if provided
    if (code !== undefined) {
      if (code.length < 2 || code.length > 5) {
        throw new BadRequestError(
          'Zone code must be between 2 and 5 characters.',
        );
      }

      // Check for duplicate code in same warehouse (excluding current zone)
      const zoneWithSameCode = await this.zonesRepository.findByCode(
        existingZone.warehouseId,
        code,
      );
      if (zoneWithSameCode && !zoneWithSameCode.zoneId.equals(zoneId)) {
        throw new BadRequestError(
          'A zone with this code already exists in this warehouse.',
        );
      }
    }

    const zone = await this.zonesRepository.update({
      id: zoneId,
      code,
      name,
      description,
      isActive,
    });

    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    return { zone };
  }
}
