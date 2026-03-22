import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPipelinesQuerySchema,
  pipelineResponseSchema,
} from '@/http/schemas';
import { pipelineToDTO } from '@/mappers/sales/pipeline/pipeline-to-dto';
import { makeListPipelinesUseCase } from '@/use-cases/sales/pipelines/factories/make-list-pipelines-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPipelinesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pipelines',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PIPELINES.ACCESS,
        resource: 'pipelines',
      }),
    ],
    schema: {
      tags: ['Sales - Pipelines'],
      summary: 'List all pipelines',
      querystring: listPipelinesQuerySchema,
      response: {
        200: z.object({
          pipelines: z.array(pipelineResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { onlyActive } = request.query;

      const listPipelinesUseCase = makeListPipelinesUseCase();
      const { pipelines } = await listPipelinesUseCase.execute({
        tenantId,
        onlyActive,
      });

      return reply.status(200).send({
        pipelines: pipelines.map((p) => pipelineToDTO(p)),
      });
    },
  });
}
