import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import type { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Verifies the Sicoob webhook signature using HMAC-SHA256.
 *
 * Checks headers: x-webhook-signature, x-sicoob-signature, webhook-signature
 * Compares against the BankAccount.apiWebhookSecret for the given bankAccountId.
 *
 * The HMAC is computed over the **raw request body** (the exact byte-stream
 * Sicoob signed) — not over a re-serialized JSON. The fastify-raw-body plugin
 * is registered for webhook routes and exposes `request.rawBody`. Re-serializing
 * via JSON.stringify(request.body) would reorder keys and strip whitespace,
 * causing the signature to never match in production.
 *
 * If no secret is configured on the bank account we now refuse the request with
 * 503 instead of letting the webhook through. A tenant that forgot to configure
 * the secret would otherwise be vulnerable to spoofing — failing closed is the
 * safe default. The operator must complete the secret setup before the
 * integration can receive events.
 *
 * On success, attaches `bankAccountTenantId` to the request object so
 * downstream handlers can skip a redundant DB lookup.
 */
// Permissive type so the middleware can be used as a `preHandler` on routes
// declared with `withTypeProvider<ZodTypeProvider>` (which infers a different
// generic shape than a hand-written `FastifyRequest<{ Querystring: ... }>`).
// The Zod schema on the route already validates `bankAccountId` at runtime —
// we just narrow inside this function.
type WebhookRequest = FastifyRequest & {
  rawBody?: string | Buffer;
};

export async function verifyWebhookSignature(
  request: WebhookRequest,
  reply: FastifyReply,
): Promise<void> {
  const { bankAccountId } = request.query as { bankAccountId: string };

  const bankAccount = await prisma.bankAccount.findUnique({
    where: { id: bankAccountId },
    select: { apiWebhookSecret: true, tenantId: true },
  });

  if (!bankAccount) {
    return reply.status(404).send({ message: 'Bank account not found' });
  }

  // Attach tenantId so the handler does not need a second DB round-trip
  (
    request as FastifyRequest & { bankAccountTenantId: string }
  ).bankAccountTenantId = bankAccount.tenantId;

  const secret = bankAccount.apiWebhookSecret;

  // Fail closed when no secret is configured. A tenant without a webhook
  // secret cannot be authenticated, so accepting events would let attackers
  // spoof bank notifications and trigger fake settlements.
  if (!secret) {
    request.log.warn(
      { bankAccountId, tenantId: bankAccount.tenantId },
      'webhook rejected: webhook secret not configured for this bank account',
    );
    return reply.status(503).send({
      message: 'Webhook secret not configured for this tenant',
    });
  }

  // Try multiple header names used by PIX / Sicoob ecosystem
  const signature =
    (request.headers['x-webhook-signature'] as string | undefined) ??
    (request.headers['x-sicoob-signature'] as string | undefined) ??
    (request.headers['webhook-signature'] as string | undefined);

  if (!signature) {
    return reply
      .status(401)
      .send({ message: 'Missing webhook signature header' });
  }

  // Compute expected HMAC-SHA256 over the RAW body bytes (not the parsed/
  // re-serialized JSON). fastify-raw-body populates request.rawBody for routes
  // opted in via `config.rawBody = true`. If it is missing we refuse the
  // request — silently falling back to JSON.stringify would reintroduce the
  // exact bug this middleware aims to prevent.
  const rawBody = request.rawBody;

  if (rawBody === undefined || rawBody === null) {
    request.log.error(
      { bankAccountId },
      'webhook rejected: raw body is missing (fastify-raw-body not registered for this route?)',
    );
    return reply
      .status(500)
      .send({ message: 'Webhook raw body capture is not configured' });
  }

  const expectedSignature = createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

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
