import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import {
  createSaleFromTerminalBodySchema,
  createSaleFromTerminalConflictResponseSchema,
  createSaleFromTerminalSuccessResponseSchema,
} from '@/http/schemas/sales/pos/create-sale-from-terminal.schema';
import { makeCreateSaleFromTerminalUseCase } from '@/use-cases/sales/pos-sales/factories/make-create-sale-from-terminal-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

type RequestWithDevice = FastifyRequest & { device?: VerifiedDeviceContext };

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * POST /v1/pos/sales
 *
 * Synchronizes a sale collected by a paired POS terminal. The endpoint is
 * device-authenticated (no JWT/RBAC) and idempotent: the
 * `Idempotency-Key` header carries the terminal-generated `saleLocalUuid`
 * the use case uses to short-circuit duplicate requests.
 *
 * Status mapping:
 *  - `200 { status: 'confirmed', order }` — first sync; Order persisted, stock
 *    decremented atomically.
 *  - `200 { status: 'already_synced', order }` — repeated sync of the same
 *    `saleLocalUuid`; the previously persisted Order is returned without
 *    side effects.
 *  - `409 { status: 'conflict', conflictId, conflicts[] }` — at least one
 *    cart line was rejected (stock or fractional rule); a `PosOrderConflict`
 *    row is recorded for downstream resolution.
 *  - `400` — `Idempotency-Key` header missing / malformed, empty cart, or
 *    upstream `BadRequestError`.
 *  - `401` — `Authorization: Bearer <device-token>` missing/invalid, OR the
 *    operator is not actively authorized to operate this terminal.
 *  - `404` — referenced Customer / Pipeline missing.
 */
export async function v1CreateSaleFromTerminalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/sales',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Sales'],
      summary: 'Idempotent sale sync for a paired POS device',
      description:
        'Persists a sale collected at the terminal, decrementing item stock atomically and emitting `PosOrderConflict` rows when reality has drifted from the terminal-cached catalog. Authenticated by `Authorization: Bearer <device-token>`. Idempotency is enforced by the required `Idempotency-Key` header (UUID v4) which becomes the persisted `Order.saleLocalUuid`.',
      body: createSaleFromTerminalBodySchema,
      response: {
        200: createSaleFromTerminalSuccessResponseSchema,
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
        409: createSaleFromTerminalConflictResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const device = (request as RequestWithDevice).device;
      if (!device) {
        throw new UnauthorizedError(
          'Device context missing — verifyDeviceToken did not run.',
        );
      }

      const idempotencyKey = request.headers['idempotency-key'];
      if (typeof idempotencyKey !== 'string' || !idempotencyKey) {
        return reply
          .status(400)
          .send({ message: 'Idempotency-Key header is required.' });
      }

      if (!UUID_REGEX.test(idempotencyKey)) {
        return reply.status(400).send({
          message: 'Idempotency-Key header must be a UUID.',
        });
      }

      try {
        const createSaleFromTerminalUseCase =
          makeCreateSaleFromTerminalUseCase();
        const result = await createSaleFromTerminalUseCase.execute({
          tenantId: device.tenantId,
          posTerminalId: device.terminalId,
          saleLocalUuid: idempotencyKey,
          posSessionId: request.body.sessionId,
          posOperatorEmployeeId: request.body.operatorEmployeeId,
          cart: request.body.cart,
          payments: request.body.payments,
          customerData: request.body.customerData,
          createdAt: request.body.createdAt,
        });

        if (result.status === 'conflict') {
          return reply.status(409).send({
            status: 'conflict',
            conflictId: result.conflictId,
            conflicts: result.conflicts,
          });
        }

        return reply.status(200).send({
          status: result.status,
          order: result.order,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
