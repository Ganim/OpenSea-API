import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cancelBulkParamsSchema,
  cancelBulkResponseSchema,
} from '@/http/schemas/hr/qr-token/rotate-bulk.schema';
import { makeCancelQrRotationBulkUseCase } from '@/use-cases/hr/qr-tokens/factories/make-cancel-qr-rotation-bulk';

/**
 * POST /v1/hr/qr-tokens/rotate-bulk/:jobId/cancel
 *
 * Cooperative cancellation of an in-flight bulk rotation job. Sets the
 * `cancelled` flag on the BullMQ job data; the worker observes it between
 * chunks and stops enqueuing new chunks while the in-flight chunk completes.
 *
 * Permissão: hr.punch-devices.admin
 */
export async function v1CancelQrRotationBulkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/qr-tokens/rotate-bulk/:jobId/cancel',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_DEVICES.ADMIN,
        resource: 'hr-qr-tokens',
      }),
    ],
    schema: {
      tags: ['HR - QR Tokens'],
      summary: 'Cancela um job de rotação em massa (cooperativo)',
      params: cancelBulkParamsSchema,
      response: {
        200: cancelBulkResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      try {
        const useCase = makeCancelQrRotationBulkUseCase();
        const result = await useCase.execute({
          tenantId,
          jobId: request.params.jobId,
        });
        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
