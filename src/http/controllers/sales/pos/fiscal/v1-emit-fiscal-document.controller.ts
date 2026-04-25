import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { verifyDeviceToken } from '@/http/middlewares/verify-device-token';
import {
  emitFiscalDocumentBodySchema,
  emitFiscalDocumentResponseSchema,
} from '@/http/schemas/sales/pos/emit-fiscal-document.schema';
import { makeEmitFiscalDocumentUseCase } from '@/use-cases/sales/pos-fiscal/factories/make-emit-fiscal-document-use-case';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

import type { VerifiedDeviceContext } from '@/http/middlewares/verify-device-token';

type RequestWithDevice = FastifyRequest & { device?: VerifiedDeviceContext };

/**
 * POST /v1/pos/fiscal/emit
 *
 * Triggers NFC-e emission for an Order persisted via `POST /v1/pos/sales`
 * (Emporion Plan A — Task 32). The endpoint is device-authenticated (no
 * JWT/RBAC) and reads the requesting tenant from the device pairing.
 *
 * Status mapping (response body discriminates on `status`):
 *  - `200 { status: 'AUTHORIZED', ... }` — fresh emission; Order stamped with
 *    SEFAZ outputs.
 *  - `200 { status: 'ALREADY_EMITTED', ... }` — idempotent replay of a sale
 *    already authorized; previously persisted authorization metadata is
 *    returned without re-hitting SEFAZ.
 *  - `200 { status: 'SKIPPED', reason }` — fiscal disabled at the tenant
 *    level (`emissionMode=NONE`). Not an error.
 *  - `200 { status: 'REJECTED', errorCode, errorMessage, order }` — SEFAZ
 *    rejected the envelope; the burnt NFC-e number stays incremented (real
 *    SEFAZ behavior) and the Order is stamped with `fiscalEmissionStatus=REJECTED`.
 *  - `400` — malformed body, fiscal default not yet supported (only NFC_E in
 *    Fase 1), or non-online emission mode for this endpoint.
 *  - `401` — `Authorization: Bearer <device-token>` missing/invalid.
 *  - `404` — Order not found in the device's tenant, or tenant has no fiscal
 *    configuration yet (admin must call `PUT /v1/admin/pos/fiscal-config`).
 */
export async function v1EmitFiscalDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/fiscal/emit',
    preHandler: [verifyDeviceToken],
    schema: {
      tags: ['POS - Sales'],
      summary: 'Emit an NFC-e for a previously synchronized POS sale',
      description:
        'Device-authenticated endpoint that triggers NFC-e emission for an Order persisted via `POST /v1/pos/sales`. Idempotent: a second call for an already-authorized Order returns `ALREADY_EMITTED` with the persisted authorization metadata. Fase 1 only supports `defaultDocumentType=NFC_E` + `emissionMode=ONLINE_SYNC`. Authenticated by `Authorization: Bearer <device-token>` (no JWT/RBAC).',
      body: emitFiscalDocumentBodySchema,
      response: {
        200: emitFiscalDocumentResponseSchema,
        400: z.object({ message: z.string() }),
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
        const emitFiscalDocumentUseCase = makeEmitFiscalDocumentUseCase();
        const result = await emitFiscalDocumentUseCase.execute({
          tenantId: device.tenantId,
          orderId: request.body.orderId,
          // Operator id is unavailable on the device context (the pairing is
          // terminal-scoped, not operator-scoped). Future iterations may
          // accept an `operatorEmployeeId` body field; for Fase 1 we leave
          // `userId` unset so the audit log records the emission as
          // device-originated.
          userId: undefined,
        });

        return reply.status(200).send(result);
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
