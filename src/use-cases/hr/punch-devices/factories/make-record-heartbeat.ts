import { prisma } from '@/lib/prisma';

import {
  RecordHeartbeatUseCase,
  type HeartbeatPrisma,
} from '../record-heartbeat';

export function makeRecordHeartbeatUseCase() {
  return new RecordHeartbeatUseCase(prisma as unknown as HeartbeatPrisma);
}
