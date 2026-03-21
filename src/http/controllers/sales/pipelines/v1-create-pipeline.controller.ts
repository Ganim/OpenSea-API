import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { createPipelineSchema, pipelineResponseSchema } from '@/http/schemas';
import { pipelineToDTO } from '@/mappers/sales/pipeline/pipeline-to-dto';
import { makeCreatePipelineUseCase } from '@/use-cases/sales/pipelines/factories/make-create-pipeline-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createPipelineController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pipelines',
    preHandler: [
      verifyJwt,
      verifyTenant,
      // TODO: Add createPlanLimitsMiddleware('pipelines') when PlanResource supports 'pipelines'
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PIPELINES.ADMIN,
        resource: 'pipelines',
      }),
    ],
    schema: {
      tags: ['Sales - Pipelines'],
      summary: 'Create a new pipeline',
      body: createPipelineSchema,
      response: {
        201: z.object({
          pipeline: pipelineResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      const createPipelineUseCase = makeCreatePipelineUseCase();
      const { pipeline } = await createPipelineUseCase.execute({
        tenantId,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        type: body.type,
        isDefault: body.isDefault,
        position: body.position,
        nextPipelineId: body.nextPipelineId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PIPELINE_CREATE,
        entityId: pipeline.id.toString(),
        placeholders: {
          userName: userId,
          pipelineName: pipeline.name,
        },
        newData: {
          name: body.name,
          type: body.type,
          isDefault: body.isDefault,
        },
      });

      return reply.status(201).send({ pipeline: pipelineToDTO(pipeline) });
    },
  });
}
