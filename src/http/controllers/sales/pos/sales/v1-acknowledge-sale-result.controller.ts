import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import {
  acknowledgeSaleResultParamsSchema,
  acknowledgeSaleResultSuccessResponseSchema,
} from '@/http/schemas/sales/pos/acknowledge-sale-result.schema';
import { makeAcknowledgeSaleResultUseCase } from '@/use-cases/sales/pos-sales/factories/make-acknowledge-sale-result-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

type RequestWithDevice = FastifyRequest & { device?: VerifiedDeviceContext };

/**
 * POST /v1/pos/sales/:saleLocalUuid/ack
 *
 * Records the POS terminal's acknowledgement that it has read and processed
 * the API response for `POST /v1/pos/sales` (Task 28). The terminal calls
 * this endpoint right after consuming the create-sale result so the local
 * outbox can drop the entry safely — even if the original create-sale
 * response was lost mid-flight, the ack provides a durable signal that the
 * terminal is no longer holding the sale locally.
 *
 * Status mapping:
 *  - `200 { success: true, ackedAt }` — first ack stamps the timestamp
 *    (`Order.ackReceivedAt`). Subsequent calls return the original
 *    timestamp (idempotent — no overwrite).
 *  - `401` — `Authorization: Bearer <device-token>` header missing or invalid.
 *  - `404` — no Order with this `saleLocalUuid` exists for the device's tenant
 *    (terminal must surface a recovery flow).
 */
export async function v1AcknowledgeSaleResultController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/sales/:saleLocalUuid/ack',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Sales'],
      summary: 'Terminal acknowledgement of a synchronized POS sale',
      description:
        'Idempotent confirmation that the POS terminal has consumed the result of `POST /v1/pos/sales`. The first call stamps `Order.ackReceivedAt`; subsequent calls return the original timestamp without overwriting it. Authenticated by `Authorization: Bearer <device-token>` (no JWT/RBAC).',
      params: acknowledgeSaleResultParamsSchema,
      response: {
        200: acknowledgeSaleResultSuccessResponseSchema,
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const device = (request as RequestWithDevice).device;
      if (!device) {
        throw new UnauthorizedError(
          'Device context missing — verifyDeviceToken did not run.',
        );
      }

      try {
        const acknowledgeSaleResultUseCase = makeAcknowledgeSaleResultUseCase();
        const result = await acknowledgeSaleResultUseCase.execute({
          tenantId: device.tenantId,
          saleLocalUuid: request.params.saleLocalUuid,
        });

        return reply.status(200).send({
          success: result.success,
          ackedAt: result.ackedAt,
        });
      } catch (error) {
        if (error instanceof UnauthorizedError) {
          return reply.status(401).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
