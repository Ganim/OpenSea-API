import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeletePipelineUseCase } from '@/use-cases/sales/pipelines/factories/make-delete-pipeline-use-case';
import { makeGetPipelineByIdUseCase } from '@/use-cases/sales/pipelines/factories/make-get-pipeline-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deletePipelineController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/pipelines/:pipelineId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PIPELINES.ADMIN,
        resource: 'pipelines',
      }),
    ],
    schema: {
      tags: ['Sales - Pipelines'],
      summary: 'Delete a pipeline',
      params: z.object({
        pipelineId: z.string().uuid().describe('Pipeline UUID'),
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
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { pipelineId } = request.params;

      const getPipelineByIdUseCase = makeGetPipelineByIdUseCase();
      const { pipeline } = await getPipelineByIdUseCase.execute({
        tenantId,
        id: pipelineId,
      });

      const deletePipelineUseCase = makeDeletePipelineUseCase();
      await deletePipelineUseCase.execute({ tenantId, id: pipelineId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PIPELINE_DELETE,
        entityId: pipelineId,
        placeholders: {
          userName: userId,
          pipelineName: pipeline.name,
        },
        oldData: {
          id: pipeline.id.toString(),
          name: pipeline.name,
          type: pipeline.type,
        },
      });

      return reply.status(204).send(null);
    },
  });
}
