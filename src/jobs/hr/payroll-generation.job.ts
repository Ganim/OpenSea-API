import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { makeGenerateMonthlyPayrollDraftUseCase } from '@/use-cases/hr/payrolls/factories/make-generate-monthly-payroll-draft-use-case';

export interface PayrollGenerationJobData {
  trigger?: 'cron' | 'manual';
}

export interface PayrollGenerationRunResult {
  tenantsProcessed: number;
  failedTenants: number;
  totalCreated: number;
  totalAlreadyExisted: number;
  totalEmptyTenants: number;
}

export type PayrollUseCaseFactory = () => {
  execute: (input: { tenantId: string }) => Promise<{
    payroll: { id: { toString(): string } } | null;
    alreadyExisted?: boolean;
    referenceMonth?: number;
    referenceYear?: number;
    evaluatedEmployees?: number;
  }>;
};

export type TenantLister = () => Promise<string[]>;

const LOG_PREFIX = '[PayrollGenerationJob]';

const defaultUseCaseFactory: PayrollUseCaseFactory = () =>
  makeGenerateMonthlyPayrollDraftUseCase();

const defaultTenantLister: TenantLister = async () => {
  const tenants = await prisma.tenant.findMany({
    where: { status: 'ACTIVE', deletedAt: null },
    select: { id: true },
  });
  return tenants.map((t) => t.id);
};

export async function runPayrollGenerationJob(
  data: PayrollGenerationJobData = {},
  deps: {
    factory?: PayrollUseCaseFactory;
    listTenants?: TenantLister;
  } = {},
): Promise<PayrollGenerationRunResult> {
  const startedAt = Date.now();
  const trigger = data.trigger ?? 'cron';
  const factory = deps.factory ?? defaultUseCaseFactory;
  const listTenants = deps.listTenants ?? defaultTenantLister;

  logger.info({ trigger }, `${LOG_PREFIX} Starting payroll generation pass`);

  const tenantIds = await listTenants();
  const useCase = factory();

  const result: PayrollGenerationRunResult = {
    tenantsProcessed: tenantIds.length,
    failedTenants: 0,
    totalCreated: 0,
    totalAlreadyExisted: 0,
    totalEmptyTenants: 0,
  };

  for (const tenantId of tenantIds) {
    try {
      const out = await useCase.execute({ tenantId });

      if (!out.payroll) {
        result.totalEmptyTenants++;
        continue;
      }

      if (out.alreadyExisted) {
        result.totalAlreadyExisted++;
        continue;
      }

      result.totalCreated++;
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
    `${LOG_PREFIX} Payroll generation pass completed`,
  );

  return result;
}
