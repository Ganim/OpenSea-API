import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PaymentCharge } from '@/entities/sales/payment-charge';
import { PosTransactionPayment } from '@/entities/sales/pos-transaction-payment';
import { SALES_EVENTS } from '@/lib/events/sales-events';
import { getTypedEventBus } from '@/lib/events/typed-event-bus';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PaymentChargesRepository } from '@/repositories/sales/payment-charges-repository';
import type { PaymentConfigsRepository } from '@/repositories/sales/payment-configs-repository';
import type { PosTransactionPaymentsRepository } from '@/repositories/sales/pos-transaction-payments-repository';
import type { PosTransactionsRepository } from '@/repositories/sales/pos-transactions-repository';
import type { PaymentProviderFactory } from './payment-provider.factory';

export interface ReconciliationResult {
  processed: number;
  confirmed: number;
  failed: number;
  expired: number;
  notFound: number;
  errors: Array<{ chargeId: string; error: string }>;
}

interface LoggerLike {
  info: (obj: unknown, msg?: string) => void;
  warn: (obj: unknown, msg?: string) => void;
  error: (obj: unknown, msg?: string) => void;
}

const defaultLogger: LoggerLike = {
  info: (obj, msg) => console.log(msg ?? '[PaymentReconciliation]', obj),
  warn: (obj, msg) => console.warn(msg ?? '[PaymentReconciliation]', obj),
  error: (obj, msg) => console.error(msg ?? '[PaymentReconciliation]', obj),
};

export class ChargeReconciliationService {
  constructor(
    private chargeRepository: PaymentChargesRepository,
    private paymentConfigsRepository: PaymentConfigsRepository,
    private paymentProviderFactory: PaymentProviderFactory,
    private orderRepository: OrdersRepository,
    private logger: LoggerLike = defaultLogger,
    private posTransactionsRepository?: PosTransactionsRepository,
    private posTransactionPaymentsRepository?: PosTransactionPaymentsRepository,
    private tenantId?: string,
  ) {}

  withTenant(tenantId: string): ChargeReconciliationService {
    return new ChargeReconciliationService(
      this.chargeRepository,
      this.paymentConfigsRepository,
      this.paymentProviderFactory,
      this.orderRepository,
      this.logger,
      this.posTransactionsRepository,
      this.posTransactionPaymentsRepository,
      tenantId,
    );
  }

  async reconcileOverdueCharges(): Promise<ReconciliationResult> {
    if (!this.tenantId) {
      throw new Error('ChargeReconciliationService requires tenant context.');
    }

    const tenantId = this.tenantId;
    const result: ReconciliationResult = {
      processed: 0,
      confirmed: 0,
      failed: 0,
      expired: 0,
      notFound: 0,
      errors: [],
    };

    const tenantConfig =
      await this.paymentConfigsRepository.findByTenantId(tenantId);

    const overdueCharges = await this.chargeRepository.findPendingOverAge(
      tenantId,
      24,
    );

    result.processed = overdueCharges.length;

    if (overdueCharges.length === 0) {
      return result;
    }

    for (const pendingCharge of overdueCharges) {
      const chargeId = pendingCharge.id.toString();

      try {
        if (
          !pendingCharge.providerChargeId ||
          pendingCharge.provider === 'manual'
        ) {
          result.notFound += 1;
          this.logger.warn(
            {
              tenantId,
              chargeId,
              provider: pendingCharge.provider,
            },
            '[PaymentReconciliation] Skipping charge without provider reference',
          );
          continue;
        }

        const paymentProvider = this.paymentProviderFactory.resolveByName(
          tenantConfig,
          pendingCharge.provider,
          pendingCharge.method,
        );

        const providerStatus = await paymentProvider.checkStatus(
          pendingCharge.providerChargeId,
        );

        if (providerStatus.status === 'PAID') {
          const updatedRows =
            await this.chargeRepository.updateStatusIdempotent(
              chargeId,
              'PAID',
              providerStatus.paidAmount ?? pendingCharge.amount,
              providerStatus.paidAt ?? new Date(),
              {
                source: 'payment-reconciliation',
                providerStatus,
              },
            );

          if (updatedRows > 0) {
            pendingCharge.markAsPaid(
              providerStatus.paidAmount ?? pendingCharge.amount,
              providerStatus.paidAt,
            );
            await this.handleConfirmedCharge(pendingCharge);
            result.confirmed += 1;
          }
          continue;
        }

        if (
          providerStatus.status === 'FAILED' ||
          providerStatus.status === 'REFUNDED'
        ) {
          const updatedRows =
            await this.chargeRepository.updateStatusIdempotent(
              chargeId,
              'FAILED',
              providerStatus.paidAmount,
              providerStatus.paidAt,
              {
                source: 'payment-reconciliation',
                providerStatus,
              },
            );

          if (updatedRows > 0) {
            pendingCharge.markAsFailed();
            await this.handleFailedCharge(pendingCharge);
            result.failed += 1;
          }
          continue;
        }

        if (providerStatus.status === 'EXPIRED') {
          const updatedRows =
            await this.chargeRepository.updateStatusIdempotent(
              chargeId,
              'EXPIRED',
              undefined,
              undefined,
              {
                source: 'payment-reconciliation',
                providerStatus,
              },
            );

          if (updatedRows > 0) {
            pendingCharge.markAsExpired();
            await this.handleExpiredCharge(pendingCharge);
            result.expired += 1;
          }
          continue;
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);

        if (this.isProviderNotFoundError(error)) {
          result.notFound += 1;
        } else {
          result.errors.push({
            chargeId,
            error: errorMessage,
          });
        }

        this.logger.error(
          {
            tenantId,
            chargeId,
            provider: pendingCharge.provider,
            error,
          },
          '[PaymentReconciliation] Failed to reconcile charge',
        );
      }
    }

    this.logger.info(
      {
        tenantId,
        processed: result.processed,
        confirmed: result.confirmed,
        failed: result.failed,
        expired: result.expired,
        notFound: result.notFound,
        errors: result.errors.length,
      },
      '[PaymentReconciliation] Tenant reconciliation completed',
    );

    return result;
  }

  private async handleConfirmedCharge(charge: PaymentCharge): Promise<void> {
    const tenantId = charge.tenantId.toString();
    const order = await this.orderRepository.findById(
      new UniqueEntityID(charge.orderId.toString()),
      tenantId,
    );

    if (!order) {
      return;
    }

    const paidAmount = charge.paidAmount ?? charge.amount;

    await this.createTransactionPaymentIfApplicable(charge, paidAmount);

    order.paidAmount = Math.min(
      order.grandTotal,
      order.paidAmount + paidAmount,
    );

    const orderCharges = await this.chargeRepository.findByOrder(
      order.id.toString(),
      tenantId,
    );

    const allChargesPaid =
      orderCharges.length > 0 &&
      orderCharges.every((orderCharge) => orderCharge.status === 'PAID');

    let orderWasConfirmed = false;
    if (allChargesPaid && order.status !== 'CONFIRMED') {
      order.status = 'CONFIRMED';
      order.confirm();
      orderWasConfirmed = true;
    }

    await this.orderRepository.save(order);

    await getTypedEventBus().publish({
      type: SALES_EVENTS.PAYMENT_CONFIRMED,
      version: 1,
      tenantId,
      source: 'sales',
      sourceEntityType: 'payment-charge',
      sourceEntityId: charge.id.toString(),
      data: {
        chargeId: charge.id.toString(),
        orderId: order.id.toString(),
        provider: charge.provider,
        providerChargeId: charge.providerChargeId,
        amount: charge.amount,
        paidAmount,
        paidAt: charge.paidAt?.toISOString(),
        method: charge.method,
      },
      metadata: {
        userId: 'system',
      },
    });

    await getTypedEventBus().publish({
      type: SALES_EVENTS.ORDER_PAID,
      version: 1,
      tenantId,
      source: 'sales',
      sourceEntityType: 'order',
      sourceEntityId: order.id.toString(),
      data: {
        orderId: order.id.toString(),
        customerId: order.customerId.toString(),
        paymentMethod: charge.method,
        paymentAmount: paidAmount,
        total: order.grandTotal,
        items: [],
      },
      metadata: {
        userId: 'system',
      },
    });

    if (orderWasConfirmed) {
      await getTypedEventBus().publish({
        type: SALES_EVENTS.ORDER_CONFIRMED,
        version: 1,
        tenantId,
        source: 'sales',
        sourceEntityType: 'order',
        sourceEntityId: order.id.toString(),
        data: {
          orderId: order.id.toString(),
          customerId: order.customerId.toString(),
          items: [],
          total: order.grandTotal,
        },
        metadata: {
          userId: 'system',
        },
      });
    }
  }

  private async handleFailedCharge(charge: PaymentCharge): Promise<void> {
    const tenantId = charge.tenantId.toString();

    await getTypedEventBus().publish({
      type: SALES_EVENTS.PAYMENT_FAILED,
      version: 1,
      tenantId,
      source: 'sales',
      sourceEntityType: 'payment-charge',
      sourceEntityId: charge.id.toString(),
      data: {
        chargeId: charge.id.toString(),
        orderId: charge.orderId.toString(),
        provider: charge.provider,
        providerChargeId: charge.providerChargeId,
        amount: charge.amount,
        method: charge.method,
      },
      metadata: {
        userId: 'system',
      },
    });
  }

  private async handleExpiredCharge(charge: PaymentCharge): Promise<void> {
    const tenantId = charge.tenantId.toString();

    await getTypedEventBus().publish({
      type: SALES_EVENTS.PAYMENT_EXPIRED,
      version: 1,
      tenantId,
      source: 'sales',
      sourceEntityType: 'payment-charge',
      sourceEntityId: charge.id.toString(),
      data: {
        chargeId: charge.id.toString(),
        orderId: charge.orderId.toString(),
        provider: charge.provider,
        providerChargeId: charge.providerChargeId,
        amount: charge.amount,
        method: charge.method,
      },
      metadata: {
        userId: 'system',
      },
    });
  }

  private async createTransactionPaymentIfApplicable(
    charge: PaymentCharge,
    paidAmount: number,
  ): Promise<void> {
    if (
      charge.transactionPaymentId ||
      !this.posTransactionsRepository ||
      !this.posTransactionPaymentsRepository
    ) {
      return;
    }

    const tenantId = charge.tenantId.toString();
    const orderId = charge.orderId.toString();

    const transaction = await this.posTransactionsRepository.findByOrderId(
      orderId,
      tenantId,
    );

    if (!transaction) {
      return;
    }

    const payment = PosTransactionPayment.create({
      tenantId: new UniqueEntityID(tenantId),
      transactionId: transaction.id,
      method: charge.method,
      amount: paidAmount,
      receivedAmount: paidAmount,
      changeAmount: 0,
      installments: 1,
      pixTxId: charge.providerChargeId,
      notes: `Auto-generated by payment reconciliation for charge ${charge.id.toString()}`,
    });

    await this.posTransactionPaymentsRepository.create(payment);

    charge.transactionPaymentId = payment.id;
    await this.chargeRepository.save(charge);
  }

  private isProviderNotFoundError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const normalizedMessage = error.message.toLowerCase();

    return (
      normalizedMessage.includes('not found') ||
      normalizedMessage.includes('404')
    );
  }
}
