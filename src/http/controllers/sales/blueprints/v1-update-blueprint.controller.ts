import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  blueprintResponseSchema,
  updateBlueprintSchema,
} from '@/http/schemas/sales/blueprints';
import { processBlueprintToDTO } from '@/mappers/sales/process-blueprint/process-blueprint-to-dto';
import { makeUpdateBlueprintUseCase } from '@/use-cases/sales/blueprints/factories/make-update-blueprint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateBlueprintController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/sales/blueprints/:blueprintId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BLUEPRINTS.MODIFY,
        resource: 'blueprints',
      }),
    ],
    schema: {
      tags: ['Sales - Blueprints'],
      summary: 'Update a process blueprint',
      params: z.object({
        blueprintId: z.string().uuid(),
      }),
      body: updateBlueprintSchema,
      response: {
        200: z.object({
          blueprint: blueprintResponseSchema,
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
      const { blueprintId } = request.params;
      const body = request.body;

      const useCase = makeUpdateBlueprintUseCase();
      const { blueprint } = await useCase.execute({
        tenantId,
        blueprintId,
        name: body.name,
        isActive: body.isActive,
        stageRules: body.stageRules,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BLUEPRINT_UPDATE,
        entityId: blueprint.id.toString(),
        placeholders: {
          userName: userId,
          blueprintName: blueprint.name,
        },
        newData: {
          name: body.name,
          isActive: body.isActive,
          stageRulesCount: body.stageRules?.length,
        },
      });

      return reply.status(200).send({
        blueprint: processBlueprintToDTO(blueprint),
      });
    },
  });
}
