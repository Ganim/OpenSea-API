import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPipelineStageSchema, pipelineStageResponseSchema } from '@/http/schemas';
import { pipelineStageToDTO } from '@/mappers/sales/pipeline-stage/pipeline-stage-to-dto';
import { makeCreatePipelineStageUseCase } from '@/use-cases/sales/pipeline-stages/factories/make-create-pipeline-stage-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPipelineStageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pipelines/:pipelineId/stages',
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
      summary: 'Create a new pipeline stage',
      params: z.object({
        pipelineId: z.string().uuid().describe('Pipeline UUID'),
      }),
      body: createPipelineStageSchema,
      response: {
        201: z.object({
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
      const { pipelineId } = request.params;
      const body = request.body;

      const createPipelineStageUseCase = makeCreatePipelineStageUseCase();
      const { stage } = await createPipelineStageUseCase.execute({
        tenantId,
        pipelineId,
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
        message: AUDIT_MESSAGES.SALES.PIPELINE_STAGE_CREATE,
        entityId: stage.id.toString(),
        placeholders: {
          userName: userId,
          stageName: stage.name,
        },
        newData: {
          name: body.name,
          type: body.type,
          pipelineId,
        },
      });

      return reply.status(201).send({ stage: pipelineStageToDTO(stage) });
    },
  });
}
