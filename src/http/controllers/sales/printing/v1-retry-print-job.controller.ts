import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createLabelPrintJobResponseSchema,
  retryPrintJobParamsSchema,
} from '@/http/schemas/sales/printing/print-job.schema';
import { makeRetryPrintJobUseCase } from '@/use-cases/sales/printing/factories/make-retry-print-job-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function v1RetryPrintJobController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/print-jobs/:id/retry',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.PRINT,
        resource: 'sales-print-jobs',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'Retry a failed print job',
      description:
        'Creates a new print job from a failed one with the same content and printer.',
      params: retryPrintJobParamsSchema,
      response: {
        201: createLabelPrintJobResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      try {
        const useCase = makeRetryPrintJobUseCase();
        const result = await useCase.execute({
          tenantId: request.user.tenantId!,
          jobId: request.params.id,
        });

        return reply.status(201).send(result);
      } catch (error) {
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
