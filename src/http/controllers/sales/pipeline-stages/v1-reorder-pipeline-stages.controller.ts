import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { reorderStagesSchema } from '@/http/schemas';
import { makeReorderPipelineStagesUseCase } from '@/use-cases/sales/pipeline-stages/factories/make-reorder-pipeline-stages-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function reorderPipelineStagesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/pipelines/:pipelineId/stages/reorder',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PIPELINES.ADMIN,
        resource: 'pipelines',
      }),
    ],
    schema: {
      tags: ['Sales - Pipeline Stages'],
      summary: 'Reorder pipeline stages',
      params: z.object({
        pipelineId: z.string().uuid().describe('Pipeline UUID'),
      }),
      body: reorderStagesSchema,
      response: {
        204: z.null(),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { pipelineId } = request.params;
      const { stageIds } = request.body;

      const reorderPipelineStagesUseCase = makeReorderPipelineStagesUseCase();
      await reorderPipelineStagesUseCase.execute({
        pipelineId,
        stageIds,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PIPELINE_STAGE_REORDER,
        entityId: pipelineId,
        placeholders: {
          userName: userId,
        },
        newData: { stageIds },
      });

      return reply.status(204).send(null);
    },
  });
}
