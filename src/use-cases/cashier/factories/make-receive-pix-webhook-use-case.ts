import type { ReceivePixWebhookUseCase } from '../receive-pix-webhook';

// TODO: Implement when PixCharge Prisma model is added to schema.prisma
// Will use: PrismaPixChargesRepository, getPixProvider()
export function makeReceivePixWebhookUseCase(): ReceivePixWebhookUseCase {
  throw new Error(
    'makeReceivePixWebhookUseCase: PrismaPixChargesRepository not yet implemented. Add PixCharge model to schema.prisma first.',
  );
}
