import type { ListPixChargesUseCase } from '../list-pix-charges';

// TODO: Implement when PixCharge Prisma model is added to schema.prisma
// Will use: PrismaPixChargesRepository
export function makeListPixChargesUseCase(): ListPixChargesUseCase {
  throw new Error(
    'makeListPixChargesUseCase: PrismaPixChargesRepository not yet implemented. Add PixCharge model to schema.prisma first.',
  );
}
