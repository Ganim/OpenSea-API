import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import {
  onboardingChecklistResponseSchema,
  updateOnboardingChecklistSchema,
} from '@/http/schemas/hr/onboarding';
import { onboardingChecklistToDTO } from '@/mappers/hr/onboarding-checklist';
import { makeUpdateOnboardingChecklistUseCase } from '@/use-cases/hr/onboarding/factories/make-update-onboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateOnboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/onboarding/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONBOARDING.MODIFY,
        resource: 'onboarding',
      }),
    ],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'Update onboarding checklist',
      description: 'Updates the title or items of an onboarding checklist',
      params: z.object({
        id: idSchema,
      }),
      body: updateOnboardingChecklistSchema,
      response: {
        200: z.object({
          checklist: onboardingChecklistResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;
      const { title, items } = request.body;

      try {
        const updateOnboardingChecklistUseCase =
          makeUpdateOnboardingChecklistUseCase();
        const { checklist } = await updateOnboardingChecklistUseCase.execute({
          tenantId,
          id,
          title,
          items,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ONBOARDING_UPDATE,
          entityId: id,
          placeholders: {
            userName: request.user.sub,
            employeeName: checklist.employeeId.toString(),
          },
          newData: {
            title: checklist.title,
            itemCount: checklist.items.length,
            progress: checklist.progress,
          },
        });

        return reply.status(200).send({
          checklist: onboardingChecklistToDTO(checklist),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
