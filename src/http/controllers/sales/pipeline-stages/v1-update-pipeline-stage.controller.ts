import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  pipelineStageResponseSchema,
  updatePipelineStageSchema,
} from '@/http/schemas';
import { pipelineStageToDTO } from '@/mappers/sales/pipeline-stage/pipeline-stage-to-dto';
import { makeUpdatePipelineStageUseCase } from '@/use-cases/sales/pipeline-stages/factories/make-update-pipeline-stage-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePipelineStageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
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
      summary: 'Update a pipeline stage',
      params: z.object({
        stageId: z.string().uuid().describe('Pipeline Stage UUID'),
      }),
      body: updatePipelineStageSchema,
      response: {
        200: z.object({
          stage: pipelineStageResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { stageId } = request.params;
      const body = request.body;

      const updatePipelineStageUseCase = makeUpdatePipelineStageUseCase();
      const { stage } = await updatePipelineStageUseCase.execute({
        tenantId,
        id: stageId,
        name: body.name,
        color: body.color,
        icon: body.icon,
        position: body.position,
        type: body.type,
        probability: body.probability,
        autoActions: body.autoActions,
        rottenAfterDays: body.rottenAfterDays,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PIPELINE_STAGE_UPDATE,
        entityId: stage.id.toString(),
        placeholders: {
          userName: userId,
          stageName: stage.name,
        },
        newData: {
          name: body.name,
          type: body.type,
          color: body.color,
        },
      });

      return reply.status(200).send({ stage: pipelineStageToDTO(stage) });
    },
  });
}
