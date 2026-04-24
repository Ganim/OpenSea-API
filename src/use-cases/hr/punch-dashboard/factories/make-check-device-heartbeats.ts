import { prisma } from '@/lib/prisma';

import {
  CheckDeviceHeartbeatsUseCase,
  type HeartbeatPrisma,
} from '../check-device-heartbeats';

/**
 * Phase 07 / Plan 07-05a — factory do `CheckDeviceHeartbeatsUseCase`.
 *
 * Injeta o PrismaClient. Consumido pelo scheduler
 * `punch-device-offline-scheduler` (tick 1min).
 *
 * Type-assertion para `HeartbeatPrisma` é intencional — o shape mínimo do
 * use case é compatível com `PrismaClient` em runtime (apenas
 * `punchDevice.findMany` + `update`).
 */
export function makeCheckDeviceHeartbeatsUseCase() {
  return new CheckDeviceHeartbeatsUseCase(prisma as unknown as HeartbeatPrisma);
}
