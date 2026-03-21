import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DivergenceResolution } from '@/entities/stock/inventory-session-item';
import type { InventorySessionItem } from '@/entities/stock/inventory-session-item';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { InventorySessionItemsRepository } from '@/repositories/stock/inventory-session-items-repository';
import type { InventorySessionsRepository } from '@/repositories/stock/inventory-sessions-repository';
import type { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';

interface ResolveDivergenceUseCaseRequest {
  tenantId: string;
  sessionId: string;
  sessionItemId: string;
  resolution: DivergenceResolution;
  userId: string;
  notes?: string;
}

interface ResolveDivergenceUseCaseResponse {
  sessionItem: InventorySessionItem;
}

export class ResolveDivergenceUseCase {
  constructor(
    private inventorySessionsRepository: InventorySessionsRepository,
    private inventorySessionItemsRepository: InventorySessionItemsRepository,
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    input: ResolveDivergenceUseCaseRequest,
  ): Promise<ResolveDivergenceUseCaseResponse> {
    const { tenantId, sessionId, sessionItemId, resolution, userId } = input;

    // Load session
    const session = await this.inventorySessionsRepository.findById(
      new UniqueEntityID(sessionId),
      tenantId,
    );
    if (!session) {
      throw new ResourceNotFoundError('Inventory session not found.');
    }

    // Load session item
    const sessionItem = await this.inventorySessionItemsRepository.findById(
      new UniqueEntityID(sessionItemId),
    );
    if (!sessionItem) {
      throw new ResourceNotFoundError('Inventory session item not found.');
    }

    // Validate belongs to session
    if (!sessionItem.sessionId.equals(session.id)) {
      throw new BadRequestError(
        'Session item does not belong to this session.',
      );
    }

    // Validate the item is divergent
    if (!sessionItem.isDivergent) {
      throw new BadRequestError('Only divergent items can be resolved.');
    }

    if (sessionItem.isResolved) {
      throw new BadRequestError('Item already resolved.');
    }

    // Load physical item
    const item = await this.itemsRepository.findById(
      sessionItem.itemId,
      tenantId,
    );
    if (!item) {
      throw new ResourceNotFoundError('Physical item not found.');
    }

    // Apply resolution
    await this.transactionManager.run(async () => {
      switch (resolution) {
        case 'LOSS_REGISTERED': {
          // Create inventory adjustment movement (exit)
          await this.itemMovementsRepository.create({
            tenantId,
            itemId: item.id,
            userId: new UniqueEntityID(userId),
            quantity: item.currentQuantity,
            quantityBefore: item.currentQuantity,
            quantityAfter: 0,
            movementType: MovementType.create('INVENTORY_ADJUSTMENT'),
            reasonCode: 'INVENTORY_LOSS',
            notes:
              input.notes ??
              `Loss registered during inventory session ${sessionId}`,
          });
          item.currentQuantity = 0;
          await this.itemsRepository.save(item);
          break;
        }

        case 'TRANSFERRED': {
          // Move the item to its expected bin
          if (sessionItem.expectedBinId) {
            item.binId = sessionItem.expectedBinId;
            await this.itemsRepository.save(item);

            await this.itemMovementsRepository.create({
              tenantId,
              itemId: item.id,
              userId: new UniqueEntityID(userId),
              quantity: item.currentQuantity,
              quantityBefore: item.currentQuantity,
              quantityAfter: item.currentQuantity,
              movementType: MovementType.create('TRANSFER'),
              reasonCode: 'INVENTORY_CORRECTION',
              notes:
                input.notes ??
                `Transfer corrected during inventory session ${sessionId}`,
            });
          }
          break;
        }

        case 'ENTRY_CREATED': {
          // Create a new item entry at the expected bin
          await this.itemMovementsRepository.create({
            tenantId,
            itemId: item.id,
            userId: new UniqueEntityID(userId),
            quantity: item.currentQuantity,
            quantityBefore: 0,
            quantityAfter: item.currentQuantity,
            movementType: MovementType.create('INVENTORY_ADJUSTMENT'),
            reasonCode: 'INVENTORY_ENTRY',
            notes:
              input.notes ??
              `Entry created during inventory session ${sessionId}`,
          });
          break;
        }

        case 'PENDING_REVIEW': {
          // No immediate action, just mark for supervisor review
          break;
        }

        default:
          throw new BadRequestError(`Invalid resolution type: ${resolution}`);
      }

      // Update the session item with resolution
      sessionItem.resolve(resolution, new UniqueEntityID(userId));
      if (input.notes) {
        sessionItem.notes = input.notes;
      }
      await this.inventorySessionItemsRepository.save(sessionItem);
    });

    return { sessionItem };
  }
}
