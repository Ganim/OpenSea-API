import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { recordPaymentReconciliation } from '@/lib/telemetry/payment-reconciliation-telemetry';
import { PrismaOrdersRepository } from '@/repositories/sales/prisma/prisma-orders-repository';
import { PrismaPaymentChargesRepository } from '@/repositories/sales/prisma/prisma-payment-charges-repository';
import { PrismaPaymentConfigsRepository } from '@/repositories/sales/prisma/prisma-payment-configs-repository';
import { PrismaPosTransactionPaymentsRepository } from '@/repositories/sales/prisma/prisma-pos-transaction-payments-repository';
import { PrismaPosTransactionsRepository } from '@/repositories/sales/prisma/prisma-pos-transactions-repository';
import { ChargeReconciliationService } from '@/services/payment/charge-reconciliation.service';
import { PaymentProviderFactory } from '@/services/payment/payment-provider.factory';

export class PaymentReconciliationWorker {
  private reconciliationService: ChargeReconciliationService;

  constructor() {
    this.reconciliationService = new ChargeReconciliationService(
      new PrismaPaymentChargesRepository(),
      new PrismaPaymentConfigsRepository(),
      new PaymentProviderFactory(),
      new PrismaOrdersRepository(),
      logger,
      new PrismaPosTransactionsRepository(),
      new PrismaPosTransactionPaymentsRepository(),
    );
  }

  async execute(): Promise<void> {
    const tenants = await this.getTenantsThatNeedReconciliation();

    if (tenants.length === 0) {
      logger.info(
        '[PaymentReconciliationWorker] No tenants with overdue pending charges',
      );
      return;
    }

    for (const tenant of tenants) {
      const startedAt = Date.now();

      try {
        const result = await this.reconciliationService
          .withTenant(tenant.id)
          .reconcileOverdueCharges();

        logger.info(
          {
            tenantId: tenant.id,
            processed: result.processed,
            confirmed: result.confirmed,
            failed: result.failed,
            expired: result.expired,
            notFound: result.notFound,
            errors: result.errors.length,
          },
          '[PaymentReconciliationWorker] Tenant reconciliation completed',
        );

        recordPaymentReconciliation({
          tenantId: tenant.id,
          processed: result.processed,
          confirmed: result.confirmed,
          failed: result.failed,
          expired: result.expired,
          duration: Date.now() - startedAt,
          success: result.errors.length === 0,
        });
      } catch (error) {
        logger.error(
          {
            tenantId: tenant.id,
            error,
          },
          '[PaymentReconciliationWorker] Tenant reconciliation failed',
        );

        recordPaymentReconciliation({
          tenantId: tenant.id,
          processed: 0,
          confirmed: 0,
          failed: 0,
          expired: 0,
          duration: Date.now() - startedAt,
          success: false,
        });
      }
    }
  }

  private async getTenantsThatNeedReconciliation(): Promise<
    Array<{ id: string }>
  > {
    const thresholdDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const tenants = await prisma.tenant.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        tenantPaymentConfig: {
          is: {
            OR: [
              {
                primaryActive: true,
              },
              {
                fallbackActive: true,
              },
            ],
          },
        },
        paymentCharges: {
          some: {
            status: 'PENDING',
            createdAt: {
              lt: thresholdDate,
            },
          },
        },
      },
      select: {
        id: true,
      },
    });

    return tenants;
  }
}
