import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verifies the Sicoob webhook signature using HMAC-SHA256.
 *
 * Checks headers: x-webhook-signature, x-sicoob-signature, webhook-signature
 * Compares against the BankAccount.apiWebhookSecret for the given bankAccountId.
 *
 * If no secret is configured on the bank account, the webhook is accepted
 * (backwards-compatible for accounts that haven't set a secret yet).
 *
 * On success, attaches `bankAccountTenantId` to the request object so
 * downstream handlers can skip a redundant DB lookup.
 */
export async function verifyWebhookSignature(
  request: FastifyRequest<{ Querystring: { bankAccountId: string } }>,
  reply: FastifyReply,
): Promise<void> {
  const { bankAccountId } = request.query;

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
    select: { apiWebhookSecret: true, tenantId: true },
  });

  if (!bankAccount) {
    return reply.status(404).send({ message: 'Bank account not found' });
  }

  // Attach tenantId so the handler does not need a second DB round-trip
  (request as FastifyRequest & { bankAccountTenantId: string }).bankAccountTenantId =
    bankAccount.tenantId;

  const secret = bankAccount.apiWebhookSecret;

  // No secret configured — allow the webhook (backwards-compatible)
  if (!secret) {
    return;
  }

  // Try multiple header names used by PIX / Sicoob ecosystem
  const signature =
    (request.headers['x-webhook-signature'] as string | undefined) ??
    (request.headers['x-sicoob-signature'] as string | undefined) ??
    (request.headers['webhook-signature'] as string | undefined);

  if (!signature) {
    return reply.status(401).send({ message: 'Missing webhook signature header' });
  }

  // Compute expected HMAC-SHA256 over the raw JSON body
  const rawBody = JSON.stringify(request.body);
  const expectedSignature = createHmac('sha256', secret).update(rawBody).digest('hex');

  // Timing-safe comparison to prevent timing-based attacks
  let sigBuffer: Buffer;
  try {
    sigBuffer = Buffer.from(signature, 'hex');
  } catch {
    return reply.status(401).send({ message: 'Invalid webhook signature' });
  }

  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (
    sigBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(sigBuffer, expectedBuffer)
  ) {
    return reply.status(401).send({ message: 'Invalid webhook signature' });
  }
}
