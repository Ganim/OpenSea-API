import { prisma } from '@/lib/prisma';
import { notificationClient } from '@/modules/notifications/public/client';

import {
  ComputeDailyDigestUseCase,
  type DailyDigestPrisma,
} from '../compute-daily-digest';

/**
 * Phase 07 / Plan 07-05a — factory do `ComputeDailyDigestUseCase`.
 *
 * Injeta PrismaClient + notificationClient SDK público. Consumido pelo
 * scheduler `punch-daily-digest-scheduler` (18h timezone-tenant).
 *
 * Type-assertion para `DailyDigestPrisma` é intencional — o shape mínimo
 * do use case é compatível com `PrismaClient` em runtime (apenas as 4
 * entities que usamos). O cast evita puxar o tipo completo do Prisma para
 * as specs.
 */
export function makeComputeDailyDigestUseCase() {
  return new ComputeDailyDigestUseCase(
    prisma as unknown as DailyDigestPrisma,
    notificationClient,
  );
}
