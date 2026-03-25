import type { CreatePixChargeUseCase } from '../create-pix-charge';

// TODO: Implement when PixCharge Prisma model is added to schema.prisma
// Will use: PrismaPixChargesRepository, PrismaTenantConsumptionsRepository, getPixProvider()
export function makeCreatePixChargeUseCase(): CreatePixChargeUseCase {
  throw new Error(
    'makeCreatePixChargeUseCase: PrismaPixChargesRepository not yet implemented. Add PixCharge model to schema.prisma first.',
  );
}
