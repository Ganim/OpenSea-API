import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface GetZoneItemStatsUseCaseRequest {
  tenantId: string;
  zoneId: string;
}

interface GetZoneItemStatsUseCaseResponse {
  totalBins: number;
  activeBins: number;
  blockedBins: number;
  occupiedBins: number;
  totalItems: number;
  itemsInBlockedBins: number;
}

export class GetZoneItemStatsUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private binsRepository: BinsRepository,
  ) {}

  async execute({
    tenantId,
    zoneId,
  }: GetZoneItemStatsUseCaseRequest): Promise<GetZoneItemStatsUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    const zone = await this.zonesRepository.findById(zoneEntityId, tenantId);
    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const activeBins = await this.binsRepository.findManyByZone(
      zoneEntityId,
      tenantId,
    );

    const binItemCounts = await this.binsRepository.countItemsPerBin(
      zoneEntityId,
      tenantId,
    );

    let totalItems = 0;
    let occupiedBins = 0;
    let blockedBins = 0;
    let itemsInBlockedBins = 0;

    for (const bin of activeBins) {
      const itemCount = binItemCounts.get(bin.binId.toString()) ?? 0;

      if (itemCount > 0) {
        occupiedBins++;
        totalItems += itemCount;
      }

      if (bin.isBlocked) {
        blockedBins++;
        if (itemCount > 0) {
          itemsInBlockedBins += itemCount;
        }
      }
    }

    return {
      totalBins: activeBins.length,
      activeBins: activeBins.length - blockedBins,
      blockedBins,
      occupiedBins,
      totalItems,
      itemsInBlockedBins,
    };
  }
}
