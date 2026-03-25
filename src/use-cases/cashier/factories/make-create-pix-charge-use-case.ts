import { PrismaPixChargesRepository } from '@/repositories/cashier/prisma/prisma-pix-charges-repository';
import { PrismaTenantConsumptionsRepository } from '@/repositories/core/prisma/prisma-tenant-consumptions-repository';
import { getPixProvider } from '@/services/cashier/pix-provider-factory';
import { CreatePixChargeUseCase } from '../create-pix-charge';

export function makeCreatePixChargeUseCase() {
  const pixChargesRepository = new PrismaPixChargesRepository();
  const consumptionsRepository = new PrismaTenantConsumptionsRepository();
  const pixProvider = getPixProvider();

  return new CreatePixChargeUseCase(
    pixChargesRepository,
    consumptionsRepository,
    pixProvider,
  );
}
