import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  ZoneStructure,
  type ZoneStructureProps,
} from '@/entities/stock/value-objects/zone-structure';
import type { Zone } from '@/entities/stock/zone';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { WarehousesRepository } from '@/repositories/stock/warehouses-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import {
  computeZoneDiff,
  type ZoneDiffResult,
} from './helpers/compute-zone-diff';
import { validateZoneStructureInput } from './helpers/validate-zone-structure';

interface ConfigureZoneStructureUseCaseRequest {
  tenantId: string;
  zoneId: string;
  userId: string;
  structure: ZoneStructureProps;
  regenerateBins?: boolean;
  forceRemoveOccupiedBins?: boolean;
}

export interface BlockedBinInfo {
  binId: string;
  address: string;
  itemCount: number;
}

interface ConfigureZoneStructureUseCaseResponse {
  zone: Zone;
  binsCreated: number;
  binsPreserved: number;
  binsUpdated: number;
  binsDeleted: number;
  binsBlocked: number;
  itemsDetached: number;
  blockedBins: BlockedBinInfo[];
}

export class ConfigureZoneStructureUseCase {
  constructor(
    private zonesRepository: ZonesRepository,
    private binsRepository: BinsRepository,
    private warehousesRepository: WarehousesRepository,
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
  ) {}

  async execute({
    tenantId,
    zoneId,
    userId,
    structure,
    regenerateBins = true,
    forceRemoveOccupiedBins = false,
  }: ConfigureZoneStructureUseCaseRequest): Promise<ConfigureZoneStructureUseCaseResponse> {
    const zoneEntityId = new UniqueEntityID(zoneId);

    const zone = await this.zonesRepository.findById(zoneEntityId, tenantId);
    if (!zone) {
      throw new ResourceNotFoundError('Zone');
    }

    const warehouse = await this.warehousesRepository.findById(
      zone.warehouseId,
      tenantId,
    );
    if (!warehouse) {
      throw new ResourceNotFoundError('Warehouse');
    }

    validateZoneStructureInput(structure);

    const zoneStructure = ZoneStructure.fromJSON(structure);

    if (zoneStructure.totalBins < 1) {
      throw new BadRequestError(
        'Zone structure must include aisles, shelves per aisle, and bins per shelf.',
      );
    }

    if (zoneStructure.totalBins > 10000) {
      throw new BadRequestError(
        `Configuration would create ${zoneStructure.totalBins} bins. Maximum is 10,000 bins per zone.`,
      );
    }

    let binsCreated = 0;
    let binsPreserved = 0;
    let binsUpdated = 0;
    let binsDeleted = 0;
    let binsBlocked = 0;
    let itemsDetached = 0;
    let blockedBins: BlockedBinInfo[] = [];

    if (regenerateBins) {
      const existingBins = await this.binsRepository.findManyByZone(
        zoneEntityId,
        tenantId,
      );

      const newBinData = zoneStructure.generateBinData(
        warehouse.code,
        zone.code,
      );

      if (existingBins.length === 0) {
        // First configuration: create all bins directly
        binsCreated = await this.binsRepository.createMany({
          tenantId,
          zoneId: zoneEntityId,
          bins: newBinData,
        });
      } else {
        // Reconfiguration: compute diff
        const binItemCounts = await this.binsRepository.countItemsPerBin(
          zoneEntityId,
          tenantId,
        );

        const diff: ZoneDiffResult = computeZoneDiff(
          existingBins,
          newBinData,
          binItemCounts,
        );

        // Block if occupied bins being removed and not forced
        if (diff.toBlock.length > 0 && !forceRemoveOccupiedBins) {
          const totalAffectedItems = diff.toBlock.reduce(
            (sum, b) => sum + b.itemCount,
            0,
          );
          throw new BadRequestError(
            `Reconfiguration would affect ${diff.toBlock.length} bin(s) containing ` +
              `${totalAffectedItems} item(s). These bins will be blocked for relocation. ` +
              `Use forceRemoveOccupiedBins=true to proceed.`,
          );
        }

        // 1. Update addresses of preserved bins if codePattern changed
        const addressUpdates = diff.toPreserve
          .filter((p) => p.addressChanged)
          .map((p) => ({
            id: p.existingBin.binId.toString(),
            address: p.newAddress,
          }));

        if (addressUpdates.length > 0) {
          binsUpdated = await this.binsRepository.updateAddressMany(
            addressUpdates,
          );
        }

        // 2. Create new bins
        if (diff.toCreate.length > 0) {
          binsCreated = await this.binsRepository.createMany({
            tenantId,
            zoneId: zoneEntityId,
            bins: diff.toCreate,
          });
        }

        // 3. Soft-delete empty removed bins
        if (diff.toDelete.length > 0) {
          const deleteIds = diff.toDelete.map((b) => b.binId.toString());
          binsDeleted = await this.binsRepository.softDeleteMany(deleteIds);
        }

        // 4. Handle occupied removed bins
        if (diff.toBlock.length > 0) {
          if (forceRemoveOccupiedBins) {
            const blockBinIds = diff.toBlock.map((b) =>
              b.bin.binId.toString(),
            );

            // Build items data for movement records
            const itemsForMovements: Array<{
              itemId: string;
              binAddress: string;
              currentQuantity: number;
            }> = [];

            for (const { bin } of diff.toBlock) {
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
            itemsDetached =
              await this.itemsRepository.detachItemsFromBins(
                blockBinIds,
                tenantId,
              );

            // Create ZONE_RECONFIGURE movements
            if (itemsForMovements.length > 0) {
              await this.itemMovementsRepository.createBatchForZoneReconfigure({
                tenantId,
                items: itemsForMovements,
                userId,
                notes: `Zone ${zone.code} reconfigured. Bins removed from structure.`,
              });
            }

            // Soft-delete the bins
            binsDeleted += await this.binsRepository.softDeleteMany(
              blockBinIds,
            );
          } else {
            // Block bins (mark as blocked, don't delete)
            for (const { bin } of diff.toBlock) {
              await this.binsRepository.update({
                id: bin.binId,
                isBlocked: true,
                blockReason:
                  'Removed from zone structure. Contains items pending relocation.',
              });
            }
            binsBlocked = diff.toBlock.length;
          }
        }

        binsPreserved = diff.toPreserve.length;
        blockedBins = diff.toBlock
          .filter(() => !forceRemoveOccupiedBins)
          .map((b) => ({
            binId: b.bin.binId.toString(),
            address: b.bin.address,
            itemCount: b.itemCount,
          }));
      }
    }

    // Update zone structure
    const updatedZone = await this.zonesRepository.updateStructure({
      id: zoneEntityId,
      structure: zoneStructure.toJSON(),
    });

    if (!updatedZone) {
      throw new ResourceNotFoundError('Zone');
    }

    return {
      zone: updatedZone,
      binsCreated,
      binsPreserved,
      binsUpdated,
      binsDeleted,
      binsBlocked,
      itemsDetached,
      blockedBins,
    };
  }
}
