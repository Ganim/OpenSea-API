import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { pipelineResponseSchema } from '@/http/schemas';
import { pipelineToDTO } from '@/mappers/sales/pipeline/pipeline-to-dto';
import { makeGetPipelineByIdUseCase } from '@/use-cases/sales/pipelines/factories/make-get-pipeline-by-id-use-case';
import { makeListPipelineStagesUseCase } from '@/use-cases/sales/pipeline-stages/factories/make-list-pipeline-stages-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getPipelineByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pipelines/:pipelineId',
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
      summary: 'Get a pipeline by ID (includes stages)',
      params: z.object({
        pipelineId: z.string().uuid().describe('Pipeline UUID'),
      }),
      response: {
        200: z.object({
          pipeline: pipelineResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { pipelineId } = request.params;

      const getPipelineByIdUseCase = makeGetPipelineByIdUseCase();
      const { pipeline } = await getPipelineByIdUseCase.execute({
        tenantId,
        id: pipelineId,
      });

      // Also fetch stages for this pipeline
      const listPipelineStagesUseCase = makeListPipelineStagesUseCase();
      const { stages } = await listPipelineStagesUseCase.execute({
        pipelineId,
      });

      return reply
        .status(200)
        .send({ pipeline: pipelineToDTO(pipeline, stages) });
    },
  });
}
