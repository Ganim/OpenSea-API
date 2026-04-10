import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPrintJobsQuerySchema,
  listPrintJobsResponseSchema,
} from '@/http/schemas/sales/printing/print-job.schema';
import { makeListPrintJobsUseCase } from '@/use-cases/sales/printing/factories/make-list-print-jobs-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

export async function v1ListPrintJobsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/print-jobs',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PRINTING.ACCESS,
        resource: 'sales-print-jobs',
      }),
    ],
    schema: {
      tags: ['Sales - Printing'],
      summary: 'List print jobs',
      description:
        'Returns paginated print jobs with optional status and printer filters.',
      querystring: listPrintJobsQuerySchema,
      response: {
        200: listPrintJobsResponseSchema,
      },
    },
    handler: async (request, reply) => {
      const useCase = makeListPrintJobsUseCase();
      const { jobs, meta } = await useCase.execute({
        tenantId: request.user.tenantId!,
        ...request.query,
      });

      return reply.status(200).send({
        jobs: jobs.map((job) => ({
          id: job.id.toString(),
          printerId: job.printerId.toString(),
          printerName: job.printerName ?? null,
          type: job.type,
          status: job.status,
          copies: job.copies,
          createdAt: job.createdAt.toISOString(),
          completedAt: job.completedAt?.toISOString() ?? null,
          errorMessage: job.errorMessage ?? null,
        })),
        meta,
      });
    },
  });
}
