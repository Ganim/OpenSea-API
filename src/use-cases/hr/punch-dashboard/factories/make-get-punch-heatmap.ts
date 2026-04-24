import { prisma } from '@/lib/prisma';

import {
  GetPunchHeatmapUseCase,
  type HeatmapPrisma,
} from '../get-punch-heatmap';

/**
 * Phase 07 / Plan 07-05b — factory do `GetPunchHeatmapUseCase`.
 *
 * Cast `as unknown as HeatmapPrisma` no boundary — pattern consistente com
 * 07-05a (DailyDigestPrisma factory). O shape mínimo do use case captura
 * apenas as 5 sub-tabelas consumidas; PrismaClient real expõe milhares
 * de métodos, então fazemos a coerção explícita.
 */
export function makeGetPunchHeatmapUseCase() {
  return new GetPunchHeatmapUseCase(prisma as unknown as HeatmapPrisma);
}
