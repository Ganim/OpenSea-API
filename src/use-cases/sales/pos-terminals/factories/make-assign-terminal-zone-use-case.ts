import { PrismaPosTerminalZonesRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-zones-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';

import { AssignTerminalZoneUseCase } from '../assign-terminal-zone';

export function makeAssignTerminalZoneUseCase(): AssignTerminalZoneUseCase {
  return new AssignTerminalZoneUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaZonesRepository(),
    new PrismaPosTerminalZonesRepository(),
  );
}
