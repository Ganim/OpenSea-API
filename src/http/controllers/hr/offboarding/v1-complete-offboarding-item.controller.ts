import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { offboardingChecklistResponseSchema } from '@/http/schemas/hr/offboarding';
import { offboardingChecklistToDTO } from '@/mappers/hr/offboarding-checklist';
import { makeCompleteOffboardingItemUseCase } from '@/use-cases/hr/offboarding/factories/make-complete-offboarding-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CompleteOffboardingItemController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/offboarding/:id/items/:itemId/complete',
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
      summary: 'Complete an offboarding item',
      description:
        'Marks an offboarding checklist item as completed and recalculates progress',
      params: z.object({
        id: z.string(),
        itemId: z.string(),
      }),
      response: {
        200: z.object({
          checklist: offboardingChecklistResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id, itemId } = request.params;

      try {
        const completeOffboardingItemUseCase =
          makeCompleteOffboardingItemUseCase();
        const { checklist } = await completeOffboardingItemUseCase.execute({
          tenantId,
          checklistId: id,
          itemId,
        });

        const completedItem = checklist.items.find(
          (item) => item.id === itemId,
        );

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.OFFBOARDING_ITEM_COMPLETE,
          entityId: checklist.id.toString(),
          placeholders: {
            userName: request.user.sub,
            itemTitle: completedItem?.title ?? itemId,
          },
          newData: { itemId, progress: checklist.progress },
        });

        return reply.status(200).send({
          checklist: offboardingChecklistToDTO(checklist),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
