import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type {
  OriginalCartLine,
  PosOrderConflict,
} from '@/entities/sales/pos-order-conflict';
import { PosOrderConflictStatus } from '@/entities/sales/value-objects/pos-order-conflict-status';
import { MovementType } from '@/entities/stock/value-objects/movement-type';
import { type OrderDTO, orderToDTO } from '@/mappers/sales/order/order-to-dto';
import {
  type PosOrderConflictDTO,
  posOrderConflictToDTO,
} from '@/mappers/sales/pos-order-conflict/pos-order-conflict-to-dto';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PosOrderConflictsRepository } from '@/repositories/sales/pos-order-conflicts-repository';
import type { ItemMovementsRepository } from '@/repositories/stock/item-movements-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';
import type { CreateOrderUseCase } from '../orders/create-order';

/**
 * Three operator-facing actions that can resolve a POS Order Conflict
 * (Emporion Plan A — Task 31).
 *
 * - `CANCEL_AND_REFUND`: admin acknowledges the sale cannot proceed. An Order
 *   is created in `CANCELLED` status (so the audit trail keeps a record of
 *   the attempt) and no stock is decremented.
 * - `FORCE_ADJUSTMENT`: admin asserts the physical stock matches what the
 *   terminal saw — the system was wrong. The conflicting items receive an
 *   `INVENTORY_ADJUSTMENT` movement that brings the on-hand count up to the
 *   requested quantity, and the Order is then created normally (CONFIRMED).
 *   Only `INSUFFICIENT_STOCK` and `ITEM_NOT_FOUND` reasons trigger an
 *   adjustment — fractional rule failures are *rule* errors, not stock
 *   errors, so no movement is recorded for them.
 * - `SUBSTITUTE_ITEM`: admin manually picks substitutes for the conflicting
 *   cart lines. The substitutes must exist for the tenant and have enough
 *   on-hand stock for the requested quantity. Non-conflicting lines flow
 *   through unchanged. The Order is created CONFIRMED.
 */
export type ResolveConflictAction =
  | 'CANCEL_AND_REFUND'
  | 'FORCE_ADJUSTMENT'
  | 'SUBSTITUTE_ITEM';

export interface ResolveConflictManuallyRequest {
  tenantId: string;
  conflictId: string;
  resolvedByUserId: string;
  action: ResolveConflictAction;
  notes?: string;
  /**
   * Required when `action === 'SUBSTITUTE_ITEM'`. One id per conflicting cart
   * line, in the same order the conflicts appear in
   * `PosOrderConflict.conflictDetails`. Length must match
   * `conflictDetails.length`.
   */
  substituteItemIds?: string[];
}

export interface ResolveConflictManuallyResponse {
  conflict: PosOrderConflictDTO;
  order: OrderDTO;
}

/**
 * Resolves a `PosOrderConflict` (status `PENDING_RESOLUTION`) by performing
 * one of three operator-driven actions: cancel the sale and refund, force a
 * stock adjustment and re-create the Order, or substitute the conflicting
 * cart lines with admin-picked items.
 *
 * Invariants enforced regardless of the action:
 *  - The conflict must belong to the requesting tenant (cross-tenant
 *    resolution is rejected with `ResourceNotFoundError`).
 *  - The conflict must be in `PENDING_RESOLUTION` status; already-resolved or
 *    expired conflicts are rejected with `BadRequestError`.
 *  - For `FORCE_ADJUSTMENT` and `SUBSTITUTE_ITEM` the conflict must carry the
 *    original sale snapshot (`originalCart`, `originalPayments`,
 *    `originalCustomerData`) — legacy conflicts created before Task 31's
 *    migration cannot use these actions and must be canceled instead.
 *
 * Audit signal:
 *  - One audit log per resolution path (`POS_CONFLICT_RESOLVE_*`). Audit is
 *    fire-and-forget so a queue-side failure never rolls back the resolution.
 */
export class ResolveConflictManuallyUseCase {
  constructor(
    private posOrderConflictsRepository: PosOrderConflictsRepository,
    private ordersRepository: OrdersRepository,
    private itemsRepository: ItemsRepository,
    private itemMovementsRepository: ItemMovementsRepository,
    private customersRepository: CustomersRepository,
    private pipelinesRepository: PipelinesRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
    private createOrderUseCase: CreateOrderUseCase,
  ) {}

  async execute(
    request: ResolveConflictManuallyRequest,
  ): Promise<ResolveConflictManuallyResponse> {
    const conflict = await this.posOrderConflictsRepository.findById(
      new UniqueEntityID(request.conflictId),
      request.tenantId,
    );

    if (!conflict) {
      throw new ResourceNotFoundError('POS conflict not found.');
    }

    if (!conflict.status.isPendingResolution) {
      throw new BadRequestError(
        `POS conflict cannot be resolved: current status is ${conflict.status.value} (only PENDING_RESOLUTION conflicts can be resolved).`,
      );
    }

    switch (request.action) {
      case 'CANCEL_AND_REFUND':
        return this.executeCancelAndRefund(conflict, request);
      case 'FORCE_ADJUSTMENT':
        return this.executeForceAdjustment(conflict, request);
      case 'SUBSTITUTE_ITEM':
        return this.executeSubstituteItem(conflict, request);
      default: {
        // exhaustive guard — narrows `request.action` to never.
        const exhaustiveCheck: never = request.action;
        throw new BadRequestError(
          `Unsupported resolution action: ${exhaustiveCheck as string}.`,
        );
      }
    }
  }

  // ---- CANCEL_AND_REFUND ---------------------------------------------------

  private async executeCancelAndRefund(
    conflict: PosOrderConflict,
    request: ResolveConflictManuallyRequest,
  ): Promise<ResolveConflictManuallyResponse> {
    const cart = this.requireOriginalCart(
      conflict,
      'CANCEL_AND_REFUND requires the conflict to carry the original cart snapshot.',
    );

    const customerId = await this.resolveCustomerId(conflict, request.tenantId);
    const { pipelineId, stageId } = await this.resolvePdvPipelineAndStage(
      request.tenantId,
    );

    const subtotal = this.computeSubtotal(cart);
    const discountTotal = this.computeDiscountTotal(cart);
    const cancelReason = this.buildCancelReason(request.notes);

    const { order } = await this.createOrderUseCase.execute({
      tenantId: request.tenantId,
      type: 'ORDER',
      customerId,
      pipelineId,
      stageId,
      channel: 'PDV',
      subtotal,
      discountTotal,
      items: cart.map((line) => ({
        variantId: line.variantId,
        name: line.name,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountValue: line.discountValue,
      })),
      notes: request.notes,
      originSource: 'POS_DESKTOP',
      posTerminalId: conflict.posTerminalId,
      posSessionId: conflict.posSessionId ?? undefined,
      posOperatorEmployeeId: conflict.posOperatorEmployeeId ?? undefined,
      saleLocalUuid: conflict.saleLocalUuid,
    });

    order.status = 'CANCELLED';
    order.cancel(cancelReason);
    await this.ordersRepository.save(order);

    conflict.resolve(
      PosOrderConflictStatus.CANCELED_REFUNDED(),
      request.resolvedByUserId,
      {
        action: 'CANCEL_AND_REFUND',
        notes: request.notes ?? null,
        orderId: order.id.toString(),
      },
    );
    conflict.linkOrder(order.id.toString());
    await this.posOrderConflictsRepository.save(conflict);

    this.fireAndForgetAudit({
      action: 'POS_CONFLICT_RESOLVE_CANCEL_AND_REFUND',
      conflict,
      order,
      resolvedByUserId: request.resolvedByUserId,
      extraData: { notes: request.notes ?? null },
    });

    return {
      conflict: posOrderConflictToDTO(conflict),
      order: orderToDTO(order),
    };
  }

  // ---- FORCE_ADJUSTMENT ----------------------------------------------------

  private async executeForceAdjustment(
    conflict: PosOrderConflict,
    request: ResolveConflictManuallyRequest,
  ): Promise<ResolveConflictManuallyResponse> {
    const cart = this.requireOriginalCart(
      conflict,
      'FORCE_ADJUSTMENT requires the conflict to carry the original cart snapshot.',
    );

    // Adjust stock for every conflict whose reason is stock-related. Rule
    // violations (FRACTIONAL_NOT_ALLOWED / BELOW_MIN_FRACTIONAL_SALE) do not
    // produce an adjustment because they aren't quantity errors.
    const stockAdjustmentDetails = conflict.conflictDetails.filter(
      (detail) =>
        detail.reason === 'INSUFFICIENT_STOCK' ||
        detail.reason === 'ITEM_NOT_FOUND',
    );

    let adjustmentCount = 0;

    for (const detail of stockAdjustmentDetails) {
      const item = await this.itemsRepository.findById(
        new UniqueEntityID(detail.itemId),
        request.tenantId,
      );

      if (!item) {
        // Cannot force-adjust a phantom item — surface as BadRequestError so
        // the admin understands the resolution path is impossible.
        throw new BadRequestError(
          `Cannot force-adjust missing item ${detail.itemId}: item does not exist for the tenant.`,
        );
      }

      const quantityBefore = item.currentQuantity;
      const quantityAfter = quantityBefore + detail.shortage;

      // INVENTORY_ADJUSTMENT carries a positive delta when increasing stock.
      // We bring `currentQuantity` up to the requested amount before the
      // Order creation runs, then `atomicDecrement` consumes the requested
      // quantity, leaving the system reconciled with the operator's claim.
      item.currentQuantity = quantityAfter;
      await this.itemsRepository.save(item);

      await this.itemMovementsRepository.create({
        tenantId: request.tenantId,
        itemId: item.id,
        userId: new UniqueEntityID(request.resolvedByUserId),
        quantity: detail.shortage,
        quantityBefore,
        quantityAfter,
        movementType: MovementType.create('INVENTORY_ADJUSTMENT'),
        reasonCode: 'POS_CONFLICT_FORCE_ADJUSTMENT',
        notes:
          request.notes ??
          `Force adjustment from POS conflict ${conflict.id.toString()} (sale ${conflict.saleLocalUuid})`,
      });

      adjustmentCount++;
    }

    const customerId = await this.resolveCustomerId(conflict, request.tenantId);
    const { pipelineId, stageId } = await this.resolvePdvPipelineAndStage(
      request.tenantId,
    );

    const subtotal = this.computeSubtotal(cart);
    const discountTotal = this.computeDiscountTotal(cart);
    const paidAmount = this.computePaidAmount(conflict);

    // Decrement stock for every cart line. Adjustments above ensured the
    // shortages no longer exist, so this should always succeed; if it does
    // not, the underlying repo will surface the error and the resolution
    // attempt is aborted (atomicity is best-effort here — a transaction
    // manager could be wired in later if cross-step rollback is required).
    for (const line of cart) {
      await this.itemsRepository.atomicDecrement(
        new UniqueEntityID(line.itemId),
        line.quantity,
        request.tenantId,
      );
    }

    const { order } = await this.createOrderUseCase.execute({
      tenantId: request.tenantId,
      type: 'ORDER',
      customerId,
      pipelineId,
      stageId,
      channel: 'PDV',
      subtotal,
      discountTotal,
      items: cart.map((line) => ({
        variantId: line.variantId,
        name: line.name,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountValue: line.discountValue,
      })),
      notes: request.notes,
      originSource: 'POS_DESKTOP',
      posTerminalId: conflict.posTerminalId,
      posSessionId: conflict.posSessionId ?? undefined,
      posOperatorEmployeeId: conflict.posOperatorEmployeeId ?? undefined,
      saleLocalUuid: conflict.saleLocalUuid,
    });

    order.status = 'CONFIRMED';
    order.confirm();
    if (paidAmount > 0) {
      order.paidAmount = paidAmount;
    }
    await this.ordersRepository.save(order);

    conflict.resolve(
      PosOrderConflictStatus.FORCED_ADJUSTMENT(),
      request.resolvedByUserId,
      {
        action: 'FORCE_ADJUSTMENT',
        notes: request.notes ?? null,
        orderId: order.id.toString(),
        adjustmentCount,
      },
    );
    conflict.linkOrder(order.id.toString());
    await this.posOrderConflictsRepository.save(conflict);

    this.fireAndForgetAudit({
      action: 'POS_CONFLICT_RESOLVE_FORCE_ADJUSTMENT',
      conflict,
      order,
      resolvedByUserId: request.resolvedByUserId,
      extraData: {
        notes: request.notes ?? null,
        adjustmentCount,
      },
    });

    return {
      conflict: posOrderConflictToDTO(conflict),
      order: orderToDTO(order),
    };
  }

  // ---- SUBSTITUTE_ITEM -----------------------------------------------------

  private async executeSubstituteItem(
    conflict: PosOrderConflict,
    request: ResolveConflictManuallyRequest,
  ): Promise<ResolveConflictManuallyResponse> {
    const cart = this.requireOriginalCart(
      conflict,
      'SUBSTITUTE_ITEM requires the conflict to carry the original cart snapshot.',
    );

    if (
      !request.substituteItemIds ||
      request.substituteItemIds.length !== conflict.conflictDetails.length
    ) {
      throw new BadRequestError(
        `SUBSTITUTE_ITEM requires exactly ${conflict.conflictDetails.length} substituteItemIds (one per conflicting cart line).`,
      );
    }

    // Map conflicting cart lines (matched by itemId) to their substitutes.
    const substitutionByConflictItemId = new Map<string, string>();
    for (
      let conflictIndex = 0;
      conflictIndex < conflict.conflictDetails.length;
      conflictIndex++
    ) {
      substitutionByConflictItemId.set(
        conflict.conflictDetails[conflictIndex].itemId,
        request.substituteItemIds[conflictIndex],
      );
    }

    // Validate each substitute exists, belongs to the tenant and has enough
    // on-hand stock to satisfy the original cart line's quantity.
    const substitutionCart: OriginalCartLine[] = [];
    for (const line of cart) {
      const substituteItemId = substitutionByConflictItemId.get(line.itemId);
      if (!substituteItemId) {
        // Line was not part of the conflict — keep it untouched.
        substitutionCart.push(line);
        continue;
      }

      const substitute = await this.itemsRepository.findById(
        new UniqueEntityID(substituteItemId),
        request.tenantId,
      );
      if (!substitute) {
        throw new BadRequestError(
          `Substitute item ${substituteItemId} not found for tenant.`,
        );
      }
      if (substitute.currentQuantity < line.quantity) {
        throw new BadRequestError(
          `Substitute item ${substituteItemId} has only ${substitute.currentQuantity} on hand but ${line.quantity} were requested.`,
        );
      }

      substitutionCart.push({
        itemId: substituteItemId,
        variantId: substitute.variantId.toString(),
        name: line.name,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountValue: line.discountValue,
      });
    }

    const customerId = await this.resolveCustomerId(conflict, request.tenantId);
    const { pipelineId, stageId } = await this.resolvePdvPipelineAndStage(
      request.tenantId,
    );

    const subtotal = this.computeSubtotal(substitutionCart);
    const discountTotal = this.computeDiscountTotal(substitutionCart);
    const paidAmount = this.computePaidAmount(conflict);

    for (const line of substitutionCart) {
      await this.itemsRepository.atomicDecrement(
        new UniqueEntityID(line.itemId),
        line.quantity,
        request.tenantId,
      );
    }

    const { order } = await this.createOrderUseCase.execute({
      tenantId: request.tenantId,
      type: 'ORDER',
      customerId,
      pipelineId,
      stageId,
      channel: 'PDV',
      subtotal,
      discountTotal,
      items: substitutionCart.map((line) => ({
        variantId: line.variantId,
        name: line.name,
        sku: line.sku,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        discountValue: line.discountValue,
      })),
      notes: request.notes,
      originSource: 'POS_DESKTOP',
      posTerminalId: conflict.posTerminalId,
      posSessionId: conflict.posSessionId ?? undefined,
      posOperatorEmployeeId: conflict.posOperatorEmployeeId ?? undefined,
      saleLocalUuid: conflict.saleLocalUuid,
    });

    order.status = 'CONFIRMED';
    order.confirm();
    if (paidAmount > 0) {
      order.paidAmount = paidAmount;
    }
    await this.ordersRepository.save(order);

    conflict.resolve(
      PosOrderConflictStatus.ITEM_SUBSTITUTED_MANUAL(),
      request.resolvedByUserId,
      {
        action: 'SUBSTITUTE_ITEM',
        notes: request.notes ?? null,
        orderId: order.id.toString(),
        substitutions: Array.from(substitutionByConflictItemId.entries()).map(
          ([originalItemId, substituteItemId]) => ({
            originalItemId,
            substituteItemId,
          }),
        ),
      },
    );
    conflict.linkOrder(order.id.toString());
    await this.posOrderConflictsRepository.save(conflict);

    this.fireAndForgetAudit({
      action: 'POS_CONFLICT_RESOLVE_SUBSTITUTE_ITEM',
      conflict,
      order,
      resolvedByUserId: request.resolvedByUserId,
      extraData: {
        notes: request.notes ?? null,
        substituteCount: request.substituteItemIds.length,
      },
    });

    return {
      conflict: posOrderConflictToDTO(conflict),
      order: orderToDTO(order),
    };
  }

  // ---- helpers -------------------------------------------------------------

  private requireOriginalCart(
    conflict: PosOrderConflict,
    errorMessage: string,
  ): OriginalCartLine[] {
    const cart = conflict.originalCart;
    if (!cart || cart.length === 0) {
      throw new BadRequestError(errorMessage);
    }
    return cart;
  }

  private async resolveCustomerId(
    conflict: PosOrderConflict,
    tenantId: string,
  ): Promise<string> {
    const data = conflict.originalCustomerData;
    if (data && data.kind === 'EXISTING') {
      const customer = await this.customersRepository.findById(
        new UniqueEntityID(data.customerId),
        tenantId,
      );
      if (!customer) {
        throw new ResourceNotFoundError(
          'Customer referenced by the original sale was not found.',
        );
      }
      return customer.id.toString();
    }

    const systemDefaultCustomer =
      await this.customersRepository.findSystemDefault(tenantId);
    if (!systemDefaultCustomer) {
      throw new ResourceNotFoundError(
        'System default Customer is required to resolve POS conflicts but was not found.',
      );
    }
    return systemDefaultCustomer.id.toString();
  }

  private async resolvePdvPipelineAndStage(
    tenantId: string,
  ): Promise<{ pipelineId: string; stageId: string }> {
    const pdvPipeline = await this.pipelinesRepository.findByName(
      'PDV',
      tenantId,
    );
    if (!pdvPipeline) {
      throw new ResourceNotFoundError(
        'PDV pipeline not found. Please ensure the PDV pipeline is configured.',
      );
    }

    const stages = await this.pipelineStagesRepository.findManyByPipeline(
      pdvPipeline.id,
    );
    if (stages.length === 0) {
      throw new BadRequestError('PDV pipeline has no stages configured.');
    }

    return {
      pipelineId: pdvPipeline.id.toString(),
      stageId: stages[0].id.toString(),
    };
  }

  private computeSubtotal(cart: OriginalCartLine[]): number {
    return cart.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  }

  private computeDiscountTotal(cart: OriginalCartLine[]): number {
    return cart.reduce((acc, line) => acc + (line.discountValue ?? 0), 0);
  }

  private computePaidAmount(conflict: PosOrderConflict): number {
    const payments = conflict.originalPayments ?? [];
    return payments.reduce((acc, payment) => acc + payment.amount, 0);
  }

  private buildCancelReason(notes: string | undefined): string {
    return `POS conflict canceled by admin${notes ? `: ${notes}` : ''}`;
  }

  private fireAndForgetAudit(input: {
    action:
      | 'POS_CONFLICT_RESOLVE_CANCEL_AND_REFUND'
      | 'POS_CONFLICT_RESOLVE_FORCE_ADJUSTMENT'
      | 'POS_CONFLICT_RESOLVE_SUBSTITUTE_ITEM';
    conflict: PosOrderConflict;
    order: Order;
    resolvedByUserId: string;
    extraData: Record<string, unknown>;
  }): void {
    queueAuditLog({
      action: input.action,
      entity: 'POS_ORDER_CONFLICT',
      entityId: input.conflict.id.toString(),
      module: 'SALES',
      description: `POS conflict ${input.conflict.saleLocalUuid} resolved via ${input.action} (order ${input.order.orderNumber})`,
      newData: {
        conflictId: input.conflict.id.toString(),
        saleLocalUuid: input.conflict.saleLocalUuid,
        posTerminalId: input.conflict.posTerminalId,
        posSessionId: input.conflict.posSessionId,
        posOperatorEmployeeId: input.conflict.posOperatorEmployeeId,
        orderId: input.order.id.toString(),
        orderNumber: input.order.orderNumber,
        resolvedByUserId: input.resolvedByUserId,
        ...input.extraData,
      },
    }).catch(() => {});
  }
}
