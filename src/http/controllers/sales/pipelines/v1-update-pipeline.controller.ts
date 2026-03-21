import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { pipelineResponseSchema, updatePipelineSchema } from '@/http/schemas';
import { pipelineToDTO } from '@/mappers/sales/pipeline/pipeline-to-dto';
import { makeGetPipelineByIdUseCase } from '@/use-cases/sales/pipelines/factories/make-get-pipeline-by-id-use-case';
import { makeUpdatePipelineUseCase } from '@/use-cases/sales/pipelines/factories/make-update-pipeline-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updatePipelineController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
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
      summary: 'Update a pipeline',
      params: z.object({
        pipelineId: z.string().uuid().describe('Pipeline UUID'),
      }),
      body: updatePipelineSchema,
      response: {
        200: z.object({
          pipeline: pipelineResponseSchema,
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

      const getPipelineByIdUseCase = makeGetPipelineByIdUseCase();
      const { pipeline: oldPipeline } = await getPipelineByIdUseCase.execute({
        tenantId,
        id: pipelineId,
      });

      const updatePipelineUseCase = makeUpdatePipelineUseCase();
      const { pipeline } = await updatePipelineUseCase.execute({
        tenantId,
        id: pipelineId,
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        isDefault: body.isDefault,
        position: body.position,
        isActive: body.isActive,
        nextPipelineId: body.nextPipelineId,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.PIPELINE_UPDATE,
        entityId: pipeline.id.toString(),
        placeholders: {
          userName: userId,
          pipelineName: pipeline.name,
        },
        oldData: {
          name: oldPipeline.name,
          isDefault: oldPipeline.isDefault,
          isActive: oldPipeline.isActive,
        },
        newData: {
          name: body.name,
          isDefault: body.isDefault,
          isActive: body.isActive,
        },
      });

      return reply.status(200).send({ pipeline: pipelineToDTO(pipeline) });
    },
  });
}
