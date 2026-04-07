import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { Order } from '@/entities/sales/order';
import type { PosPaymentMethod } from '@/entities/sales/pos-transaction-payment';
import { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';
import { PosTransaction } from '@/entities/sales/pos-transaction';
import { SALES_EVENTS } from '@/lib/events/sales-events';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PosTransactionPaymentsRepository } from '@/repositories/sales/pos-transaction-payments-repository';
import type { PosTransactionsRepository } from '@/repositories/sales/pos-transactions-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';

type TerminalMode = 'STANDARD' | 'FAST_CHECKOUT';

interface PaymentInput {
  method: PosPaymentMethod;
  amount: number;
  receivedAmount?: number;
  installments?: number;
  authCode?: string;
  nsu?: string;
  pixTxId?: string;
}

interface ReceivePaymentUseCaseRequest {
  tenantId: string;
  orderId: string;
  userId: string;
  terminalMode: TerminalMode;
  posSessionId?: string;
  expectedVersion: number;
  hasOverridePermission?: boolean;
  payments: PaymentInput[];
}

interface ReceivePaymentUseCaseResponse {
  order: Order;
  posTransaction: PosTransaction;
  changeAmount: number;
}

export class ReceivePaymentUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private variantsRepository: VariantsRepository,
    private posTransactionsRepository: PosTransactionsRepository,
    private posTransactionPaymentsRepository: PosTransactionPaymentsRepository,
    private transactionManager?: TransactionManager,
  ) {}

  async execute(
    input: ReceivePaymentUseCaseRequest,
  ): Promise<ReceivePaymentUseCaseResponse> {
    // If transaction manager available, wrap in transaction
    if (this.transactionManager) {
      return this.transactionManager.run(() => this.executePayment(input));
    }

    // For unit tests without transaction manager
    return this.executePayment(input);
  }

  private async executePayment(
    input: ReceivePaymentUseCaseRequest,
  ): Promise<ReceivePaymentUseCaseResponse> {
    // 1. Load order with items
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(input.orderId),
      input.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    if (order.status !== 'PENDING' && order.status !== 'DRAFT') {
      throw new BadRequestError(
        'Only orders with DRAFT or PENDING status can receive payment.',
      );
    }

    // 2. Optimistic lock: validate version matches
    if (order.version !== input.expectedVersion) {
      throw new ConflictError(
        'Order was modified by another request. Please reload and try again.',
      );
    }

    // 3. Load and validate order items
    const orderItems = await this.orderItemsRepository.findManyByOrder(
      order.id,
      input.tenantId,
    );

    if (orderItems.length === 0) {
      throw new BadRequestError('Order has no items.');
    }

    // 4. Validate all variants are still active
    for (const orderItem of orderItems) {
      if (!orderItem.variantId) continue;

      const variant = await this.variantsRepository.findById(
        orderItem.variantId,
        input.tenantId,
      );

      if (!variant) {
        throw new BadRequestError(
          `Product variant for "${orderItem.name}" is no longer available.`,
        );
      }

      if (!variant.isActive) {
        throw new BadRequestError(
          `Product variant "${orderItem.name}" is no longer active.`,
        );
      }
    }

    // 5. Validate payments
    if (input.payments.length === 0) {
      throw new BadRequestError('At least one payment is required.');
    }

    let totalPaymentAmount = 0;
    for (const payment of input.payments) {
      if (payment.amount <= 0) {
        throw new BadRequestError('Payment amounts must be greater than zero.');
      }
      totalPaymentAmount += payment.amount;
    }

    if (totalPaymentAmount < order.grandTotal) {
      throw new BadRequestError(
        `Payment total (${totalPaymentAmount}) is less than order total (${order.grandTotal}).`,
      );
    }

    // 6. Non-cash methods must not exceed remaining
    let remainingAfterNonCash = order.grandTotal;
    const cashPayments: PaymentInput[] = [];
    const nonCashPayments: PaymentInput[] = [];

    for (const payment of input.payments) {
      if (payment.method === 'CASH') {
        cashPayments.push(payment);
      } else {
        nonCashPayments.push(payment);
      }
    }

    for (const payment of nonCashPayments) {
      if (payment.amount > remainingAfterNonCash) {
        throw new BadRequestError(
          `Non-cash payment of ${payment.amount} exceeds remaining amount of ${remainingAfterNonCash}.`,
        );
      }
      remainingAfterNonCash -= payment.amount;
    }

    // 7. Separation of duties check (unless FAST_CHECKOUT or override)
    if (
      input.terminalMode !== 'FAST_CHECKOUT' &&
      !input.hasOverridePermission &&
      order.assignedToUserId?.toString() === input.userId
    ) {
      throw new BadRequestError(
        'Cashier cannot process payment for their own order. Use a different cashier or enable override.',
      );
    }

    // 8. Calculate change (cash only)
    const totalCashReceived = cashPayments.reduce(
      (sum, p) => sum + (p.receivedAmount ?? p.amount),
      0,
    );
    const totalNonCash = nonCashPayments.reduce((sum, p) => sum + p.amount, 0);
    const amountDueAfterNonCash = order.grandTotal - totalNonCash;
    const changeAmount = Math.max(0, totalCashReceived - amountDueAfterNonCash);

    // 9. Create POS transaction
    const sessionId = input.posSessionId ?? 'default-session';
    const transactionNumber =
      await this.posTransactionsRepository.getNextTransactionNumber(sessionId);

    const posTransaction = PosTransaction.create({
      tenantId: new UniqueEntityID(input.tenantId),
      sessionId: new UniqueEntityID(sessionId),
      orderId: order.id,
      transactionNumber,
      subtotal: order.subtotal,
      discountTotal: order.discountTotal,
      taxTotal: order.taxTotal,
      grandTotal: order.grandTotal,
      changeAmount,
      customerId: order.customerId,
    });

    await this.posTransactionsRepository.create(posTransaction);

    // 10. Create payment records
    const transactionPayments: PosTransactionPayment[] = input.payments.map(
      (paymentInput) => {
        const isCash = paymentInput.method === 'CASH';
        const paymentChangeAmount = isCash
          ? Math.max(
              0,
              (paymentInput.receivedAmount ?? paymentInput.amount) -
                paymentInput.amount,
            )
          : 0;

        return PosTransactionPayment.create({
          tenantId: new UniqueEntityID(input.tenantId),
          transactionId: posTransaction.id,
          method: paymentInput.method,
          amount: paymentInput.amount,
          receivedAmount: paymentInput.receivedAmount,
          changeAmount: paymentChangeAmount,
          installments: paymentInput.installments,
          authCode: paymentInput.authCode,
          nsu: paymentInput.nsu,
          pixTxId: paymentInput.pixTxId,
        });
      },
    );

    await this.posTransactionPaymentsRepository.createMany(transactionPayments);

    // 11. Update order
    order.status = 'CONFIRMED';
    order.cashierUserId = new UniqueEntityID(input.userId);
    order.paidAmount = order.grandTotal;
    order.confirm(new UniqueEntityID(input.userId));

    if (input.posSessionId) {
      order.posSessionId = new UniqueEntityID(input.posSessionId);
    }

    order.version = order.version + 1;

    await this.ordersRepository.save(order);

    // 12. Emit domain event
    try {
      await getTypedEventBus().publish({
        type: SALES_EVENTS.ORDER_CONFIRMED,
        version: 1,
        tenantId: input.tenantId,
        source: 'sales',
        sourceEntityType: 'order',
        sourceEntityId: order.id.toString(),
        data: {
          orderId: order.id.toString(),
          customerId: order.customerId.toString(),
          items: orderItems.map((item) => ({
            variantId: item.variantId?.toString() ?? '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
          total: order.grandTotal,
        },
        metadata: {
          userId: input.userId,
        },
      });
    } catch {
      // Event emission failure should not block payment processing
    }

    return { order, posTransaction, changeAmount };
  }
}
