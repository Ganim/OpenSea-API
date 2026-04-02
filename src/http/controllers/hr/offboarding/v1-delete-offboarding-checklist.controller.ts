import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeGetOffboardingChecklistUseCase } from '@/use-cases/hr/offboarding/factories/make-get-offboarding-checklist-use-case';
import { makeDeleteOffboardingChecklistUseCase } from '@/use-cases/hr/offboarding/factories/make-delete-offboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteOffboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/offboarding/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OFFBOARDING.REMOVE,
        resource: 'offboarding',
      }),
    ],
    schema: {
      tags: ['HR - Offboarding'],
      summary: 'Delete offboarding checklist',
      description: 'Soft deletes an offboarding checklist',
      params: z.object({
        id: cuidSchema,
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
      const { id } = request.params;

      try {
        const getOffboardingChecklistUseCase =
          makeGetOffboardingChecklistUseCase();
        const { checklist } = await getOffboardingChecklistUseCase.execute({
          tenantId,
          id,
        });

        const deleteOffboardingChecklistUseCase =
          makeDeleteOffboardingChecklistUseCase();
        await deleteOffboardingChecklistUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.OFFBOARDING_DELETE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            employeeName: checklist.employeeId.toString(),
          },
          oldData: {
            id,
            title: checklist.title,
            employeeId: checklist.employeeId.toString(),
            progress: checklist.progress,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
