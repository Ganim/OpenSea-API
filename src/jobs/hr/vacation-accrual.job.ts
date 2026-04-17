import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { makeRunVacationAccrualUseCase } from '@/use-cases/hr/vacations/factories/make-run-vacation-accrual-use-case';

/**
 * BullMQ job payload for the HR vacation-accrual scheduled run (P3-05).
 *
 * Kept argument-less today because the run fans out across every ACTIVE tenant.
 * The explicit type reserves room for `{ tenantId }` payloads when an admin
 * endpoint needs to trigger a single tenant on-demand, without breaking the
 * repeatable job schema.
 */
export interface VacationAccrualJobData {
  trigger?: 'cron' | 'manual';
}

const LOG_PREFIX = '[VacationAccrualJob]';

export interface VacationAccrualRunResult {
  tenantsProcessed: number;
  failedTenants: number;
  totalCreated: number;
  totalSkipped: number;
  totalEvaluated: number;
}

/**
 * DI factory hook — unit tests inject a stub that does not touch Prisma.
 */
export type VacationAccrualUseCaseFactory = () => {
  execute: (input: { tenantId: string }) => Promise<{
    createdPeriods: number;
    skippedPeriods: number;
    evaluatedEmployees: number;
  }>;
};

export type TenantLister = () => Promise<string[]>;

const defaultUseCaseFactory: VacationAccrualUseCaseFactory = () =>
  makeRunVacationAccrualUseCase();

const defaultTenantLister: TenantLister = async () => {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  return tenants.map((t) => t.id);
};

export async function runVacationAccrualJob(
  data: VacationAccrualJobData = {},
  deps: {
    factory?: VacationAccrualUseCaseFactory;
    listTenants?: TenantLister;
  } = {},
): Promise<VacationAccrualRunResult> {
  const startedAt = Date.now();
  const trigger = data.trigger ?? 'cron';
  const factory = deps.factory ?? defaultUseCaseFactory;
  const listTenants = deps.listTenants ?? defaultTenantLister;

  logger.info({ trigger }, `${LOG_PREFIX} Starting vacation accrual pass`);

  const tenantIds = await listTenants();
  const useCase = factory();

  const result: VacationAccrualRunResult = {
    tenantsProcessed: tenantIds.length,
    failedTenants: 0,
    totalCreated: 0,
    totalSkipped: 0,
    totalEvaluated: 0,
  };

  for (const tenantId of tenantIds) {
    try {
      const out = await useCase.execute({ tenantId });
      result.totalCreated += out.createdPeriods;
      result.totalSkipped += out.skippedPeriods;
      result.totalEvaluated += out.evaluatedEmployees;
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
    `${LOG_PREFIX} Vacation accrual pass completed`,
  );

  return result;
}
