import { prisma } from '@/lib/prisma';
import { PrismaPunchMissedLogRepository } from '@/repositories/hr/prisma/prisma-punch-missed-log-repository';

import {
  ListMissedPunchesUseCase,
  type ListMissedPunchesPrisma,
} from '../list-missed-punches';

export function makeListMissedPunchesUseCase() {
  return new ListMissedPunchesUseCase(
    new PrismaPunchMissedLogRepository(),
    prisma as unknown as ListMissedPunchesPrisma,
  );
}
