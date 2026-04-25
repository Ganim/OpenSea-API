import { PrismaPosTerminalZonesRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-zones-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PrismaWarehousesRepository } from '@/repositories/stock/prisma/prisma-warehouses-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';
import { ListTerminalZonesUseCase } from '../list-terminal-zones';

export function makeListTerminalZonesUseCase() {
  return new ListTerminalZonesUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosTerminalZonesRepository(),
    new PrismaZonesRepository(),
    new PrismaWarehousesRepository(),
  );
}
