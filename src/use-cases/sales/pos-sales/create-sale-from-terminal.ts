import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type {
  ConflictDetail,
  PosOrderConflict,
} from '@/entities/sales/pos-order-conflict';
import { PosOrderConflict as PosOrderConflictEntity } from '@/entities/sales/pos-order-conflict';
import { type OrderDTO, orderToDTO } from '@/mappers/sales/order/order-to-dto';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PipelinesRepository } from '@/repositories/sales/pipelines-repository';
import type { PipelineStagesRepository } from '@/repositories/sales/pipeline-stages-repository';
import type { PosOrderConflictsRepository } from '@/repositories/sales/pos-order-conflicts-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { BinsRepository } from '@/repositories/stock/bins-repository';
import type { ItemsRepository } from '@/repositories/stock/items-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';
import type { ZonesRepository } from '@/repositories/stock/zones-repository';
import { queueAuditLog } from '@/workers/queues/audit.queue';
import type { CreateOrderUseCase } from '../orders/create-order';

/**
 * One line of the cart synchronized from a POS terminal. Each line points at
 * a specific physical `Item` (selected by the terminal during the sale based
 * on its locally-cached catalog) so the API can lock the row, decrement
 * stock and emit conflict signals when reality has drifted from what the
 * terminal believed.
 */
export interface CreateSaleFromTerminalCartLine {
  itemId: string;
  variantId: string;
  name: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  discountValue?: number;
}

/**
 * Payment leg recorded by the terminal for the sale. The API stores only the
 * aggregate (`paidAmount` on the Order) at this stage — the per-payment
 * `OrderPayment` rows belong to a downstream task (cashier reconciliation /
 * fiscal emission). Method values mirror the terminal's local enum.
 */
export interface CreateSaleFromTerminalPayment {
  method: string;
  amount: number;
  reference?: string | null;
}

/**
 * Customer attached to the sale. The terminal classifies the buyer into one
 * of three buckets so the API does not have to guess from missing fields:
 *  - `EXISTING` — a Customer the terminal already knows by id (looked up
 *    against the local catalog).
 *  - `CPF_ONLY` — only a CPF was collected at the till (cashier didn't open
 *    a Customer record); we fall back to the tenant's system-default
 *    Customer and stash the CPF on the Order's `notes`.
 *  - `ANONYMOUS` — no customer information; uses the system-default Customer
 *    too.
 */
export type CreateSaleFromTerminalCustomerData =
  | { kind: 'EXISTING'; customerId: string }
  | { kind: 'CPF_ONLY'; cpf: string }
  | { kind: 'ANONYMOUS' };

export interface CreateSaleFromTerminalRequest {
  tenantId: string;
  posTerminalId: string;
  saleLocalUuid: string;
  posSessionId: string;
  posOperatorEmployeeId: string;
  cart: CreateSaleFromTerminalCartLine[];
  payments: CreateSaleFromTerminalPayment[];
  customerData: CreateSaleFromTerminalCustomerData;
  createdAt: Date;
}

export interface CreateSaleFromTerminalConfirmedResponse {
  status: 'confirmed';
  order: OrderDTO;
}

export interface CreateSaleFromTerminalAlreadySyncedResponse {
  status: 'already_synced';
  order: OrderDTO;
}

export interface CreateSaleFromTerminalConflictResponse {
  status: 'conflict';
  conflictId: string;
  conflicts: ConflictDetail[];
}

export type CreateSaleFromTerminalResponse =
  | CreateSaleFromTerminalConfirmedResponse
  | CreateSaleFromTerminalAlreadySyncedResponse
  | CreateSaleFromTerminalConflictResponse;

/**
 * Idempotently registers a sale collected by a POS terminal.
 *
 * Lifecycle (Emporion Plan A — Task 28):
 *
 * 1. **Idempotency**: if an Order with the same `saleLocalUuid` already
 *    exists for the tenant, the use case short-circuits to `already_synced`
 *    and returns the persisted Order. The terminal can therefore retry the
 *    sync indefinitely without creating duplicates.
 *
 * 2. **Operator authorization**: the operator must hold an *active*
 *    `PosTerminalOperator` link for the requesting terminal. Anything else
 *    (no link, revoked link) raises `UnauthorizedError` and the sale is not
 *    persisted.
 *
 * 3. **Conflict detection (non short-circuiting)**: every cart line is
 *    validated against the current state of stock and the fractional-sale
 *    rules. Conflicts are *collected*, not fail-fast — the terminal needs
 *    the complete list to surface a conflict-resolution UI. Reasons:
 *      - `ITEM_NOT_FOUND` — item id missing or belongs to another tenant
 *      - `INSUFFICIENT_STOCK` — `currentQuantity < quantity`
 *      - `FRACTIONAL_NOT_ALLOWED` — fractional qty on a variant/zone/item
 *        that does not allow fractional sale
 *      - `BELOW_MIN_FRACTIONAL_SALE` — qty under the zone's
 *        `minFractionalSale` threshold
 *
 * 4. **Conflict path**: any conflicts ⇒ a `PosOrderConflict` row is recorded
 *    (status `PENDING_RESOLUTION`) so an operator can later decide what to do,
 *    and the response is `409` with the full detail list. No stock is
 *    decremented and no Order is created.
 *
 * 5. **Happy path (transactional)**: when no conflicts:
 *      - Open a transaction
 *      - For each line, call `itemsRepository.atomicDecrement(...)` with the
 *        transaction client (Prisma decrements in SQL, race-safe within a
 *        committed tx since the SELECT in step 3 is followed by an atomic
 *        decrement; gross overselling under concurrent pressure is bounded
 *        by the database — see decision note in the spec).
 *      - Delegate Order creation to `CreateOrderUseCase`, passing the POS
 *        origin metadata (`originSource = POS_DESKTOP`, `posTerminalId`,
 *        `posSessionId`, `posOperatorEmployeeId`, `saleLocalUuid`).
 *      - Commit.
 *
 * 6. **Audit (fire-and-forget)**: emit `POS_SALE_CREATE` outside the tx so
 *    audit pipelines never roll back business writes.
 */
export class CreateSaleFromTerminalUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private posTerminalOperatorsRepository: PosTerminalOperatorsRepository,
    private posOrderConflictsRepository: PosOrderConflictsRepository,
    private itemsRepository: ItemsRepository,
    private variantsRepository: VariantsRepository,
    private binsRepository: BinsRepository,
    private zonesRepository: ZonesRepository,
    private customersRepository: CustomersRepository,
    private pipelinesRepository: PipelinesRepository,
    private pipelineStagesRepository: PipelineStagesRepository,
    private createOrderUseCase: CreateOrderUseCase,
    private transactionManager: TransactionManager,
  ) {}

  async execute(
    request: CreateSaleFromTerminalRequest,
  ): Promise<CreateSaleFromTerminalResponse> {
    // 1. Idempotency — short-circuit when this saleLocalUuid was already synced.
    const existingOrder = await this.ordersRepository.findBySaleLocalUuid(
      request.saleLocalUuid,
      request.tenantId,
    );

    if (existingOrder) {
      return {
        status: 'already_synced',
        order: orderToDTO(existingOrder),
      };
    }

    // 2. Operator authorization — must hold an ACTIVE link to this terminal.
    const operatorLink =
      await this.posTerminalOperatorsRepository.findByTerminalAndEmployee(
        new UniqueEntityID(request.posTerminalId),
        new UniqueEntityID(request.posOperatorEmployeeId),
        request.tenantId,
      );

    if (!operatorLink || !operatorLink.isActive) {
      throw new UnauthorizedError(
        'Operator is not authorized to operate this POS terminal.',
      );
    }

    // 3. Cart validation — collect conflicts, do not fail-fast.
    if (!request.cart || request.cart.length === 0) {
      throw new BadRequestError('Cart must contain at least one line.');
    }

    const conflicts = await this.collectConflicts(request);

    // 4. Conflict path — record and respond 409 without persisting the sale.
    if (conflicts.length > 0) {
      const conflictRecord = PosOrderConflictEntity.create({
        tenantId: request.tenantId,
        saleLocalUuid: request.saleLocalUuid,
        posTerminalId: request.posTerminalId,
        posSessionId: request.posSessionId,
        posOperatorEmployeeId: request.posOperatorEmployeeId,
        conflictDetails: conflicts,
      });

      await this.posOrderConflictsRepository.create(conflictRecord);

      this.fireAndForgetConflictAudit(request, conflictRecord, conflicts);

      return {
        status: 'conflict',
        conflictId: conflictRecord.id.toString(),
        conflicts,
      };
    }

    // 5. Happy path — atomic decrement + Order creation.
    const customerId = await this.resolveCustomerId(request);
    const { pipelineId, stageId } = await this.resolvePdvPipelineAndStage(
      request.tenantId,
    );

    const subtotal = this.computeSubtotal(request.cart);
    const discountTotal = this.computeDiscountTotal(request.cart);
    const paidAmount = this.computePaidAmount(request.payments);
    const cpfOnlyNote =
      request.customerData.kind === 'CPF_ONLY'
        ? `CPF do consumidor: ${request.customerData.cpf}`
        : undefined;

    const { order } = await this.transactionManager.run(async (tx) => {
      for (const line of request.cart) {
        await this.itemsRepository.atomicDecrement(
          new UniqueEntityID(line.itemId),
          line.quantity,
          request.tenantId,
          tx,
        );
      }

      const orderResult = await this.createOrderUseCase.execute({
        tenantId: request.tenantId,
        type: 'ORDER',
        customerId,
        pipelineId,
        stageId,
        channel: 'PDV',
        subtotal,
        discountTotal,
        items: request.cart.map((line) => ({
          variantId: line.variantId,
          name: line.name,
          sku: line.sku,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          discountValue: line.discountValue,
        })),
        notes: cpfOnlyNote,
        originSource: 'POS_DESKTOP',
        posTerminalId: request.posTerminalId,
        posSessionId: request.posSessionId,
        posOperatorEmployeeId: request.posOperatorEmployeeId,
        saleLocalUuid: request.saleLocalUuid,
      });

      // Record the aggregate paid amount on the Order — per-payment legs
      // (OrderPayment rows) belong to a downstream task. We persist it now
      // so the cashier reconciliation has authoritative data without
      // having to recompute from external systems.
      if (paidAmount > 0) {
        orderResult.order.paidAmount = paidAmount;
        await this.ordersRepository.save(orderResult.order);
      }

      return orderResult;
    });

    this.fireAndForgetCreateAudit(request, order);

    return {
      status: 'confirmed',
      order: orderToDTO(order),
    };
  }

  private async collectConflicts(
    request: CreateSaleFromTerminalRequest,
  ): Promise<ConflictDetail[]> {
    const conflicts: ConflictDetail[] = [];

    for (const line of request.cart) {
      const item = await this.itemsRepository.findById(
        new UniqueEntityID(line.itemId),
        request.tenantId,
      );

      if (!item) {
        conflicts.push({
          itemId: line.itemId,
          variantId: line.variantId,
          requestedQuantity: line.quantity,
          availableQuantity: 0,
          shortage: line.quantity,
          reason: 'ITEM_NOT_FOUND',
        });
        continue;
      }

      const isFractional =
        line.quantity < Math.floor(line.quantity) + 1
          ? line.quantity !== Math.floor(line.quantity)
          : false;

      if (isFractional) {
        const variant = await this.variantsRepository.findById(
          item.variantId,
          request.tenantId,
        );

        if (!variant?.fractionalAllowed) {
          conflicts.push({
            itemId: line.itemId,
            variantId: line.variantId,
            requestedQuantity: line.quantity,
            availableQuantity: item.currentQuantity,
            shortage: 0,
            reason: 'FRACTIONAL_NOT_ALLOWED',
          });
          continue;
        }

        if (!item.fractionalSaleEnabled) {
          conflicts.push({
            itemId: line.itemId,
            variantId: line.variantId,
            requestedQuantity: line.quantity,
            availableQuantity: item.currentQuantity,
            shortage: 0,
            reason: 'FRACTIONAL_NOT_ALLOWED',
          });
          continue;
        }

        // Zone-level rules apply only when the item is allocated to a bin.
        if (item.binId) {
          const bin = await this.binsRepository.findById(
            item.binId,
            request.tenantId,
          );

          if (bin) {
            const zone = await this.zonesRepository.findById(
              bin.zoneId,
              request.tenantId,
            );

            if (zone && !zone.allowsFractionalSale) {
              conflicts.push({
                itemId: line.itemId,
                variantId: line.variantId,
                requestedQuantity: line.quantity,
                availableQuantity: item.currentQuantity,
                shortage: 0,
                reason: 'FRACTIONAL_NOT_ALLOWED',
              });
              continue;
            }

            if (
              zone?.minFractionalSale != null &&
              line.quantity < zone.minFractionalSale
            ) {
              conflicts.push({
                itemId: line.itemId,
                variantId: line.variantId,
                requestedQuantity: line.quantity,
                availableQuantity: item.currentQuantity,
                shortage: 0,
                reason: 'BELOW_MIN_FRACTIONAL_SALE',
              });
              continue;
            }
          }
        }
      }

      if (item.currentQuantity < line.quantity) {
        conflicts.push({
          itemId: line.itemId,
          variantId: line.variantId,
          requestedQuantity: line.quantity,
          availableQuantity: item.currentQuantity,
          shortage: line.quantity - item.currentQuantity,
          reason: 'INSUFFICIENT_STOCK',
        });
      }
    }

    return conflicts;
  }

  private async resolveCustomerId(
    request: CreateSaleFromTerminalRequest,
  ): Promise<string> {
    if (request.customerData.kind === 'EXISTING') {
      const customer = await this.customersRepository.findById(
        new UniqueEntityID(request.customerData.customerId),
        request.tenantId,
      );

      if (!customer) {
        throw new ResourceNotFoundError('Customer not found.');
      }

      return customer.id.toString();
    }

    const systemDefaultCustomer =
      await this.customersRepository.findSystemDefault(request.tenantId);

    if (!systemDefaultCustomer) {
      throw new ResourceNotFoundError(
        'System default Customer is required for anonymous / CPF-only POS sales but was not found.',
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

  private computeSubtotal(cart: CreateSaleFromTerminalCartLine[]): number {
    return cart.reduce((acc, line) => acc + line.quantity * line.unitPrice, 0);
  }

  private computeDiscountTotal(cart: CreateSaleFromTerminalCartLine[]): number {
    return cart.reduce((acc, line) => acc + (line.discountValue ?? 0), 0);
  }

  private computePaidAmount(payments: CreateSaleFromTerminalPayment[]): number {
    return payments.reduce((acc, payment) => acc + payment.amount, 0);
  }

  private fireAndForgetCreateAudit(
    request: CreateSaleFromTerminalRequest,
    order: Order,
  ): void {
    queueAuditLog({
      action: 'POS_SALE_CREATE',
      entity: 'ORDER',
      entityId: order.id.toString(),
      module: 'SALES',
      description: `POS sale ${request.saleLocalUuid} synced from terminal ${request.posTerminalId} (order ${order.orderNumber})`,
      newData: {
        saleLocalUuid: request.saleLocalUuid,
        posTerminalId: request.posTerminalId,
        posSessionId: request.posSessionId,
        posOperatorEmployeeId: request.posOperatorEmployeeId,
        orderNumber: order.orderNumber,
        cartLineCount: request.cart.length,
        subtotal: order.subtotal,
        grandTotal: order.grandTotal,
      },
    }).catch(() => {});
  }

  private fireAndForgetConflictAudit(
    request: CreateSaleFromTerminalRequest,
    conflictRecord: PosOrderConflict,
    conflicts: ConflictDetail[],
  ): void {
    queueAuditLog({
      action: 'POS_SALE_CONFLICT',
      entity: 'POS_ORDER_CONFLICT',
      entityId: conflictRecord.id.toString(),
      module: 'SALES',
      description: `POS sale ${request.saleLocalUuid} from terminal ${request.posTerminalId} produced ${conflicts.length} conflict(s)`,
      newData: {
        saleLocalUuid: request.saleLocalUuid,
        posTerminalId: request.posTerminalId,
        posSessionId: request.posSessionId,
        posOperatorEmployeeId: request.posOperatorEmployeeId,
        conflictCount: conflicts.length,
        reasons: conflicts.map((conflict) => conflict.reason),
      },
    }).catch(() => {});
  }
}
