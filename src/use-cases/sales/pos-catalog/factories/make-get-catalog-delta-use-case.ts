import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaPosFiscalConfigsRepository } from '@/repositories/sales/prisma/prisma-pos-fiscal-configs-repository';
import { PrismaPosTerminalOperatorsRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-operators-repository';
import { PrismaPosTerminalZonesRepository } from '@/repositories/sales/prisma/prisma-pos-terminal-zones-repository';
import { PrismaPosTerminalsRepository } from '@/repositories/sales/prisma/prisma-pos-terminals-repository';
import { PrismaVariantPromotionsRepository } from '@/repositories/sales/prisma/prisma-variant-promotions-repository';
import { PrismaItemsRepository } from '@/repositories/stock/prisma/prisma-items-repository';
import { PrismaProductsRepository } from '@/repositories/stock/prisma/prisma-products-repository';
import { PrismaVariantsRepository } from '@/repositories/stock/prisma/prisma-variants-repository';
import { PrismaZonesRepository } from '@/repositories/stock/prisma/prisma-zones-repository';

import { GetCatalogDeltaUseCase } from '../get-catalog-delta';

export function makeGetCatalogDeltaUseCase(): GetCatalogDeltaUseCase {
  return new GetCatalogDeltaUseCase(
    new PrismaPosTerminalsRepository(),
    new PrismaPosTerminalZonesRepository(),
    new PrismaZonesRepository(),
    new PrismaItemsRepository(),
    new PrismaVariantsRepository(),
    new PrismaProductsRepository(),
    new PrismaVariantPromotionsRepository(),
    new PrismaPosTerminalOperatorsRepository(),
    new PrismaEmployeesRepository(),
    new PrismaPosFiscalConfigsRepository(),
  );
}
