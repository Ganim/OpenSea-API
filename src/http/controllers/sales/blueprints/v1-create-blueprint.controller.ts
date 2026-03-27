import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  blueprintResponseSchema,
  createBlueprintSchema,
} from '@/http/schemas/sales/blueprints';
import { processBlueprintToDTO } from '@/mappers/sales/process-blueprint/process-blueprint-to-dto';
import { makeCreateBlueprintUseCase } from '@/use-cases/sales/blueprints/factories/make-create-blueprint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createBlueprintController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/blueprints',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BLUEPRINTS.REGISTER,
        resource: 'blueprints',
      }),
    ],
    schema: {
      tags: ['Sales - Blueprints'],
      summary: 'Create a new process blueprint',
      body: createBlueprintSchema,
      response: {
        201: z.object({
          blueprint: blueprintResponseSchema,
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

      const useCase = makeCreateBlueprintUseCase();
      const { blueprint } = await useCase.execute({
        tenantId,
        name: body.name,
        pipelineId: body.pipelineId,
        isActive: body.isActive,
        stageRules: body.stageRules,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BLUEPRINT_CREATE,
        entityId: blueprint.id.toString(),
        placeholders: {
          userName: userId,
          blueprintName: blueprint.name,
        },
        newData: {
          name: body.name,
          pipelineId: body.pipelineId,
          isActive: body.isActive,
          stageRulesCount: body.stageRules?.length ?? 0,
        },
      });

      return reply.status(201).send({
        blueprint: processBlueprintToDTO(blueprint),
      });
    },
  });
}
