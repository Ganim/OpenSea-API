import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ItemStatus } from '@/entities/stock/value-objects/item-status';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { ItemMovementDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import { itemMovementToDTO } from '@/mappers/stock/item-movement/item-movement-to-dto';
import type { ItemDTO } from '@/mappers/stock/item/item-to-dto';
import { itemToDTO } from '@/mappers/stock/item/item-to-dto';
import { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import { ItemsRepository } from '@/repositories/stock/items-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';

const _APPROVAL_REQUIRED_TYPES: readonly string[] = [
  'LOSS',
  'INVENTORY_ADJUSTMENT',
];

interface RegisterItemExitUseCaseRequest {
  tenantId: string;
  itemId: string;
  quantity: number;
  userId: string;
  movementType:
    | 'SALE'
    | 'PRODUCTION'
    | 'SAMPLE'
    | 'LOSS'
    | 'SUPPLIER_RETURN'
    | 'INVENTORY_ADJUSTMENT';
  reasonCode?: string;
  destinationRef?: string;
  notes?: string;
  /** Required when movementType is LOSS or INVENTORY_ADJUSTMENT */
  approvedBy?: string;
}

interface RegisterItemExitUseCaseResponse {
  item: ItemDTO;
  movement: ItemMovementDTO;
}

export class RegisterItemExitUseCase {
  constructor(
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    input: RegisterItemExitUseCaseRequest,
  ): Promise<RegisterItemExitUseCaseResponse> {
    // Validation: quantity must be positive
    if (input.quantity <= 0) {
      throw new BadRequestError('A quantidade deve ser maior que zero.');
    }

    // Validation: reasonCode max length 64
    if (input.reasonCode && input.reasonCode.length > 64) {
      throw new BadRequestError(
        'O código de motivo não pode exceder 64 caracteres.',
      );
    }

    // Validation: destinationRef max length 256
    if (input.destinationRef && input.destinationRef.length > 256) {
      throw new BadRequestError(
        'A referência de destino não pode exceder 256 caracteres.',
      );
    }

    // Validation: notes max length 1000
    if (input.notes && input.notes.length > 1000) {
      throw new BadRequestError(
        'As observações não podem exceder 1000 caracteres.',
      );
    }

    // TODO: Implementar sistema de aprovação real (PENDING_APPROVAL → aprovador aceita/rejeita)
    // Por enquanto, saídas sensíveis (LOSS, INVENTORY_ADJUSTMENT) são protegidas por PIN no frontend

    // Validation: item must exist (fast-fail outside transaction)
    const item = await this.itemsRepository.findById(
      new UniqueEntityID(input.itemId),
      input.tenantId,
    );
    if (!item) {
      throw new ResourceNotFoundError('Item não encontrado.');
    }

    // Fast-fail: check quantity before entering transaction (non-authoritative)
    const quantityBefore = item.currentQuantity;
    if (quantityBefore < input.quantity) {
      throw new BadRequestError(
        `Quantidade insuficiente. Atual: ${quantityBefore}, Solicitado: ${input.quantity}`,
      );
    }

    const { savedItem, movement } = await this.transactionManager.run(
      async (tx) => {
        // Atomic decrement prevents race condition — the DB guarantees
        // no two concurrent exits can read the same quantity
        const updatedItem = await this.itemsRepository.atomicDecrement(
          item.id,
          input.quantity,
          input.tenantId,
          tx,
        );

        // If negative, another concurrent exit consumed the stock first
        if (updatedItem.currentQuantity < 0) {
          throw new BadRequestError(
            `Quantidade insuficiente. Atual: ${quantityBefore}, Solicitado: ${input.quantity}`,
          );
        }

        const quantityAfter = updatedItem.currentQuantity;

        // If depleted, mark item as expired
        if (quantityAfter === 0) {
          updatedItem.status = ItemStatus.create('EXPIRED');
          updatedItem.exitMovementType = input.movementType;
          await this.itemsRepository.save(updatedItem, tx);
        }

        // Create movement record
        const mov = await this.itemMovementsRepository.create({
          tenantId: input.tenantId,
          itemId: item.id,
          userId: new UniqueEntityID(input.userId),
          quantity: input.quantity,
          quantityBefore,
          quantityAfter,
          movementType: MovementType.create(input.movementType),
          reasonCode: input.reasonCode,
          destinationRef: input.destinationRef,
          notes: input.notes,
        });

        return { savedItem: updatedItem, movement: mov };
      },
    );

    const quantityAfter = savedItem.currentQuantity;

    // Audit log (fire-and-forget, outside transaction)
    queueAuditLog({
      userId: input.userId,
      action: 'STOCK_ITEM_EXIT',
      entity: 'ITEM',
      entityId: input.itemId,
      module: 'stock',
      description: `Saída de item: quantidade ${input.quantity}, tipo ${input.movementType}`,
      oldData: { quantity: quantityBefore },
      newData: {
        itemId: input.itemId,
        quantity: input.quantity,
        quantityAfter,
        ...(input.approvedBy && { approvedBy: input.approvedBy }),
      },
    });

    return {
      item: itemToDTO(savedItem),
      movement: itemMovementToDTO(movement),
    };
  }
}
