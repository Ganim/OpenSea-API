import { prisma } from '@/lib/prisma';

import {
  GetPunchDashboardSummaryUseCase,
  type DashboardSummaryPrisma,
} from '../get-punch-dashboard-summary';

export function makeGetPunchDashboardSummaryUseCase() {
  return new GetPunchDashboardSummaryUseCase(
    prisma as unknown as DashboardSummaryPrisma,
  );
}
