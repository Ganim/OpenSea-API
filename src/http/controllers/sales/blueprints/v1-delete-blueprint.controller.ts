import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetBlueprintByIdUseCase } from '@/use-cases/sales/blueprints/factories/make-get-blueprint-by-id-use-case';
import { makeDeleteBlueprintUseCase } from '@/use-cases/sales/blueprints/factories/make-delete-blueprint-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteBlueprintController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/blueprints/:blueprintId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.BLUEPRINTS.REMOVE,
        resource: 'blueprints',
      }),
    ],
    schema: {
      tags: ['Sales - Blueprints'],
      summary: 'Delete a process blueprint (soft delete)',
      params: z.object({
        blueprintId: z.string().uuid(),
      }),
      response: {
        204: z.null().describe('Blueprint deleted successfully'),
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

      // Get blueprint name for audit log before deleting
      const getBlueprintUseCase = makeGetBlueprintByIdUseCase();
      const { blueprint } = await getBlueprintUseCase.execute({
        tenantId,
        blueprintId,
      });

      const deleteUseCase = makeDeleteBlueprintUseCase();
      await deleteUseCase.execute({ tenantId, blueprintId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.BLUEPRINT_DELETE,
        entityId: blueprintId,
        placeholders: {
          userName: userId,
          blueprintName: blueprint.name,
        },
        oldData: {
          name: blueprint.name,
          pipelineId: blueprint.pipelineId.toString(),
          isActive: blueprint.isActive,
        },
      });

      return reply.status(204).send(null);
    },
  });
}
