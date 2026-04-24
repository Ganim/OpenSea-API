import { prisma } from '@/lib/prisma';

import {
  GetPunchCellDetailUseCase,
  type CellDetailPrisma,
} from '../get-punch-cell-detail';

export function makeGetPunchCellDetailUseCase() {
  return new GetPunchCellDetailUseCase(prisma as unknown as CellDetailPrisma);
}
