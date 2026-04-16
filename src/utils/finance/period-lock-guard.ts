import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

export interface PeriodLockChecker {
  isPeriodLocked(tenantId: string, year: number, month: number): Promise<boolean>;
}

/**
 * Prisma-backed checker. We import prisma dynamically on each call so the
 * use-case module (which keeps a reference via DI) stays importable from
 * unit tests that don't wire a checker at all — in tests we pass `undefined`
 * and the guard is a no-op.
 */
export function buildPrismaPeriodLockChecker(): PeriodLockChecker {
  return {
    async isPeriodLocked(tenantId, year, month) {
      const { prisma } = await import('@/lib/prisma');
      const lock = await prisma.financePeriodLock.findUnique({
        where: {
          finance_period_lock_unique: { tenantId, year, month },
        },
      });
      return !!(lock && lock.releasedAt === null);
    },
  };
}

/**
 * Throws BadRequestError when the dueDate falls in a locked period. If no
 * checker is injected (e.g. unit tests using in-memory repos), the check is
 * skipped — the factory-wired controllers always provide one in production.
 */
export async function assertPeriodNotLocked(
  tenantId: string,
  dueDate: Date,
  checker?: PeriodLockChecker
): Promise<void> {
  if (!checker) return;
  const year = dueDate.getFullYear();
  const month = dueDate.getMonth() + 1;
  const locked = await checker.isPeriodLocked(tenantId, year, month);
  if (locked) {
    throw new BadRequestError(
      `Período ${String(month).padStart(2, '0')}/${year} está fechado. Libere o lock antes de editar lançamentos dessa competência.`
    );
  }
}
