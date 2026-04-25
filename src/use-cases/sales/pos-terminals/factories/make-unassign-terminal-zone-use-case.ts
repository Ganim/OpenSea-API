import { PrismaPosTerminalZonesRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-zones-repository';

import { UnassignTerminalZoneUseCase } from '../unassign-terminal-zone';

export function makeUnassignTerminalZoneUseCase(): UnassignTerminalZoneUseCase {
  return new UnassignTerminalZoneUseCase(
    new PrismaPosTerminalZonesRepository(),
  );
}
