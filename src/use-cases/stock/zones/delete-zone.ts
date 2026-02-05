import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';

interface DeleteZoneUseCaseRequest {
  tenantId: string;
  id: string;
  userId: string;
  forceDeleteBins?: boolean;
}

interface DeleteZoneUseCaseResponse {
  success: boolean;
  deletedBinsCount: number;
  itemsDetached: number;
}

export class DeleteZoneUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private binsRepository: BinsRepository,
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
  ) {}

  async execute({
    tenantId,
    id,
    userId,
    forceDeleteBins = false,
  }: DeleteZoneUseCaseRequest): Promise<DeleteZoneUseCaseResponse> {
    const zoneId = new UniqueEntityID(id);

    const zone = await this.zonesRepository.findById(zoneId, tenantId);
    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const binCount = await this.zonesRepository.countBins(zoneId);

    if (binCount > 0 && !forceDeleteBins) {
      throw new BadRequestError(
        `Zone has ${binCount} bin(s). Use forceDeleteBins=true to delete all bins.`,
      );
    }

    let deletedBinsCount = 0;
    let itemsDetached = 0;

    if (binCount > 0 && forceDeleteBins) {
      // Detach items from bins BEFORE soft-deleting bins
      const activeBins = await this.binsRepository.findManyByZone(
        zoneId,
        tenantId,
      );
      const binIds = activeBins.map((b) => b.binId.toString());

      if (binIds.length > 0) {
        // Build items data for movement records
        const itemsForMovements: Array<{
          itemId: string;
          binAddress: string;
          currentQuantity: number;
        }> = [];

        for (const bin of activeBins) {
          const binItems = await this.itemsRepository.findManyByBin(
            bin.binId,
            tenantId,
          );
          for (const item of binItems) {
            itemsForMovements.push({
              itemId: item.id.toString(),
              binAddress: bin.address,
              currentQuantity: item.currentQuantity,
            });
          }
        }

        // Detach items (sets lastKnownAddress, clears binId)
        itemsDetached = await this.itemsRepository.detachItemsFromBins(
          binIds,
          tenantId,
        );

        // Create ZONE_RECONFIGURE movements for audit trail
        if (itemsForMovements.length > 0) {
          await this.itemMovementsRepository.createBatchForZoneReconfigure({
            tenantId,
            items: itemsForMovements,
            userId,
            notes: `Zone ${zone.code} deleted. Items detached from bins.`,
          });
        }
      }

      deletedBinsCount = await this.binsRepository.deleteByZone(zoneId);
    }

    await this.zonesRepository.delete(zoneId);

    return { success: true, deletedBinsCount, itemsDetached };
  }
}
