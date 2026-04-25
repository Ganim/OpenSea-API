import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { BinsRepository } from '@/repositories/stock/bins-repository';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';
import { VariantsRepository } from '@/repositories/stock/variants-repository';
import { ZonesRepository } from '@/repositories/stock/zones-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

interface TransferItemUseCaseRequest {
  tenantId: string;
  itemId: string;
  destinationBinId: string;
  userId: string;
  reasonCode?: string;
  notes?: string;
  /**
   * When true, confirms enabling fractional sale on the item if the
   * destination zone allows fractional sale and the variant permits it.
   * When omitted/false in that scenario, the use-case returns
   * `shouldOfferFractionalConfirmation: true` so the UI can prompt
   * the user before re-calling with confirmation.
   * Fase 1 (Emporion).
   */
  confirmFractionalSale?: boolean;
}

interface TransferItemUseCaseResponse {
  item: ItemDTO;
  movement: ItemMovementDTO;
  /**
   * `true` when the transfer moved the item to a fractional-enabled zone
   * for a fractional-allowed variant, but the item was not yet flagged
   * for fractional sale and `confirmFractionalSale` was not provided.
   * The UI should prompt the user and re-call with `confirmFractionalSale: true`.
   */
  shouldOfferFractionalConfirmation: boolean;
}

export class TransferItemUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private binsRepository: BinsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
    private transactionManager: TransactionManager,
    private zonesRepository: ZonesRepository,
    private variantsRepository: VariantsRepository,
  ) {}

  async execute(
    input: TransferItemUseCaseRequest,
  ): Promise<TransferItemUseCaseResponse> {
    // Validation: reasonCode max length 64
    if (input.reasonCode && input.reasonCode.length > 64) {
      throw new BadRequestError('Reason code cannot exceed 64 characters.');
    }

    // Validation: notes max length 1000
    if (input.notes && input.notes.length > 1000) {
      throw new BadRequestError('Notes cannot exceed 1000 characters.');
    }

    // Validation: item must exist
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(input.itemId),
      input.tenantId,
    );
    if (!item) {
      throw new ResourceNotFoundError('Item not found.');
    }

    // Validation: destination bin must exist
    const destinationBin = await this.binsRepository.findById(
      new UniqueEntityID(input.destinationBinId),
      input.tenantId,
    );
    if (!destinationBin) {
      throw new ResourceNotFoundError('Destination bin not found.');
    }

    // Validation: destination must be different from current bin
    if (item.binId && item.binId.equals(destinationBin.binId)) {
      throw new BadRequestError(
        'Destination bin must be different from current bin.',
      );
    }

    // Capture origin bin address before updating
    let originAddress: string | undefined;
    const fromBinId = item.binId?.toString();
    if (item.binId) {
      const originBin = await this.binsRepository.findById(
        item.binId,
        input.tenantId,
      );
      originAddress = originBin?.address;
    }

    // Update item bin and last known address
    item.binId = destinationBin.binId;
    item.lastKnownAddress = destinationBin.address;

    // Fase 1 (Emporion) — detect fractional zone transition
    let shouldOfferFractionalConfirmation = false;

    const destinationZone = await this.zonesRepository.findById(
      destinationBin.zoneId,
      input.tenantId,
    );
    const variant = await this.variantsRepository.findById(
      item.variantId,
      input.tenantId,
    );

    if (destinationZone && variant) {
      const newZoneAllowsFractional = destinationZone.allowsFractionalSale;
      const variantAllowsFractional = variant.fractionalAllowed;

      if (
        newZoneAllowsFractional &&
        variantAllowsFractional &&
        !item.fractionalSaleEnabled
      ) {
        if (input.confirmFractionalSale) {
          item.fractionalSaleEnabled = true;
        } else {
          shouldOfferFractionalConfirmation = true;
        }
      } else if (!newZoneAllowsFractional && item.fractionalSaleEnabled) {
        // Moving to a non-fractional zone — auto-disable
        item.fractionalSaleEnabled = false;
      }
    }

    const { savedItem, movement } = await this.transactionManager.run(
      async () => {
        await this.itemsRepository.save(item);

        // Create transfer movement record
        const mov = await this.itemMovementsRepository.create({
          tenantId: input.tenantId,
          itemId: item.id,
          userId: new UniqueEntityID(input.userId),
          quantity: item.currentQuantity,
          quantityBefore: item.currentQuantity,
          quantityAfter: item.currentQuantity,
          movementType: MovementType.create('TRANSFER'),
          reasonCode: input.reasonCode,
          originRef: originAddress ?? undefined,
          destinationRef: destinationBin.address,
          notes: input.notes,
        });

        return { savedItem: item, movement: mov };
      },
    );

    // Audit log (fire-and-forget, outside transaction)
    queueAuditLog({
      userId: input.userId,
      action: 'STOCK_ITEM_TRANSFER',
      entity: 'ITEM',
      entityId: input.itemId,
      module: 'stock',
      description: `Item transfer from ${originAddress || 'no location'} to ${destinationBin.address}`,
      newData: {
        itemId: input.itemId,
        fromBinId,
        toBinId: input.destinationBinId,
      },
    });

    return {
      item: itemToDTO(savedItem),
      movement: itemMovementToDTO(movement),
      shouldOfferFractionalConfirmation,
    };
  }
}
