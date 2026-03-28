import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import {
  offboardingChecklistResponseSchema,
  updateOffboardingChecklistSchema,
} from '@/http/schemas/hr/offboarding';
import { offboardingChecklistToDTO } from '@/mappers/hr/offboarding-checklist';
import { makeUpdateOffboardingChecklistUseCase } from '@/use-cases/hr/offboarding/factories/make-update-offboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateOffboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/offboarding/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OFFBOARDING.MODIFY,
        resource: 'offboarding',
      }),
    ],
    schema: {
      tags: ['HR - Offboarding'],
      summary: 'Update offboarding checklist',
      description: 'Updates the title or items of an offboarding checklist',
      params: z.object({
        id: idSchema,
      }),
      body: updateOffboardingChecklistSchema,
      response: {
        200: z.object({
          checklist: offboardingChecklistResponseSchema,
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
        const updateOffboardingChecklistUseCase =
          makeUpdateOffboardingChecklistUseCase();
        const { checklist } = await updateOffboardingChecklistUseCase.execute({
          tenantId,
          id,
          title,
          items,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.OFFBOARDING_UPDATE,
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
          checklist: offboardingChecklistToDTO(checklist),
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
