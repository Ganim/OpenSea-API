import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { makeGetOnboardingChecklistUseCase } from '@/use-cases/hr/onboarding/factories/make-get-onboarding-checklist-use-case';
import { makeDeleteOnboardingChecklistUseCase } from '@/use-cases/hr/onboarding/factories/make-delete-onboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteOnboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/onboarding/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONBOARDING.REMOVE,
        resource: 'onboarding',
      }),
    ],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'Delete onboarding checklist',
      description: 'Soft deletes an onboarding checklist',
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
        const getOnboardingChecklistUseCase =
          makeGetOnboardingChecklistUseCase();
        const { checklist } = await getOnboardingChecklistUseCase.execute({
          tenantId,
          id,
        });

        const deleteOnboardingChecklistUseCase =
          makeDeleteOnboardingChecklistUseCase();
        await deleteOnboardingChecklistUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ONBOARDING_DELETE,
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
