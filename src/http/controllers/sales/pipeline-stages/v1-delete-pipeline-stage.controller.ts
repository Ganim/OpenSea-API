import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeletePipelineStageUseCase } from '@/use-cases/sales/pipeline-stages/factories/make-delete-pipeline-stage-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deletePipelineStageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/pipeline-stages/:stageId',
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
      summary: 'Delete a pipeline stage',
      params: z.object({
        stageId: z.string().uuid().describe('Pipeline Stage UUID'),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const { stageId } = request.params;

      const deletePipelineStageUseCase = makeDeletePipelineStageUseCase();
      await deletePipelineStageUseCase.execute({ id: stageId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PIPELINE_STAGE_DELETE,
        entityId: stageId,
        placeholders: {
          userName: userId,
          stageName: stageId,
        },
        oldData: { id: stageId },
      });

      return reply.status(204).send(null);
    },
  });
}
