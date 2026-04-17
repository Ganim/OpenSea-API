import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { makeNotifyDocExpiryUseCase } from '@/use-cases/hr/notifications/factories/make-notify-doc-expiry-use-case';

export interface DocExpiryJobData {
  trigger?: 'cron' | 'manual';
}

export interface DocExpiryRunResult {
  tenantsProcessed: number;
  failedTenants: number;
  totalNotifications: number;
  totalMedicalExams: number;
  totalTrainings: number;
}

export type DocExpiryUseCaseFactory = () => {
  execute: (input: { tenantId: string }) => Promise<{
    notificationsCreated: number;
    scannedMedicalExams: number;
    scannedTrainings: number;
  }>;
};

export type TenantLister = () => Promise<string[]>;

const LOG_PREFIX = '[DocExpiryJob]';

const defaultUseCaseFactory: DocExpiryUseCaseFactory = () =>
  makeNotifyDocExpiryUseCase();

const defaultTenantLister: TenantLister = async () => {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  return tenants.map((t) => t.id);
};

export async function runDocExpiryJob(
  data: DocExpiryJobData = {},
  deps: {
    factory?: DocExpiryUseCaseFactory;
    listTenants?: TenantLister;
  } = {},
): Promise<DocExpiryRunResult> {
  const startedAt = Date.now();
  const trigger = data.trigger ?? 'cron';
  const factory = deps.factory ?? defaultUseCaseFactory;
  const listTenants = deps.listTenants ?? defaultTenantLister;

  logger.info({ trigger }, `${LOG_PREFIX} Starting document expiry scan`);

  const tenantIds = await listTenants();
  const useCase = factory();

  const result: DocExpiryRunResult = {
    tenantsProcessed: tenantIds.length,
    failedTenants: 0,
    totalNotifications: 0,
    totalMedicalExams: 0,
    totalTrainings: 0,
  };

  for (const tenantId of tenantIds) {
    try {
      const out = await useCase.execute({ tenantId });
      result.totalNotifications += out.notificationsCreated;
      result.totalMedicalExams += out.scannedMedicalExams;
      result.totalTrainings += out.scannedTrainings;
    } catch (error) {
      result.failedTenants++;
      logger.error(
        { error, tenantId },
        `${LOG_PREFIX} Failed to process tenant`,
      );
    }
  }

  logger.info(
    { trigger, durationMs: Date.now() - startedAt, ...result },
    `${LOG_PREFIX} Document expiry scan completed`,
  );

  return result;
}
