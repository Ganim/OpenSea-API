import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { pipelineStageResponseSchema } from '@/http/schemas';
import { pipelineStageToDTO } from '@/mappers/sales/pipeline-stage/pipeline-stage-to-dto';
import { makeListPipelineStagesUseCase } from '@/use-cases/sales/pipeline-stages/factories/make-list-pipeline-stages-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function listPipelineStagesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pipelines/:pipelineId/stages',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PIPELINES.ACCESS,
        resource: 'pipelines',
      }),
    ],
    schema: {
      tags: ['Sales - Pipeline Stages'],
      summary: 'List all stages of a pipeline',
      params: z.object({
        pipelineId: z.string().uuid().describe('Pipeline UUID'),
      }),
      response: {
        200: z.object({
          stages: z.array(pipelineStageResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { pipelineId } = request.params;

      const listPipelineStagesUseCase = makeListPipelineStagesUseCase();
      const { stages } = await listPipelineStagesUseCase.execute({
        pipelineId,
      });

      return reply.status(200).send({
        stages: stages.map(pipelineStageToDTO),
      });
    },
  });
}
