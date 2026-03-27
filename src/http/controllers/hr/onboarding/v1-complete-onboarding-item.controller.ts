import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { onboardingChecklistToDTO } from '@/mappers/hr/onboarding-checklist';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCompleteOnboardingItemUseCase } from '@/use-cases/hr/onboarding/factories/make-complete-onboarding-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CompleteOnboardingItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/my/onboarding/:itemId/complete',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'Complete an onboarding item',
      description:
        'Marks an onboarding checklist item as completed and recalculates progress',
      params: z.object({
        itemId: z.string(),
      }),
      response: {
        200: z.object({
          checklist: z.object({
            id: z.string(),
            employeeId: z.string(),
            items: z.array(
              z.object({
                id: z.string(),
                title: z.string(),
                description: z.string().optional(),
                completed: z.boolean(),
                completedAt: z.date().optional(),
              }),
            ),
            progress: z.number(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { itemId } = request.params;

      const employeesRepository = new PrismaEmployeesRepository();
      const employee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!employee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const completeOnboardingItemUseCase =
          makeCompleteOnboardingItemUseCase();
        const { checklist } = await completeOnboardingItemUseCase.execute({
          tenantId,
          employeeId: employee.id.toString(),
          itemId,
        });

        const completedItem = checklist.items.find(
          (item) => item.id === itemId,
        );

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ONBOARDING_ITEM_COMPLETE,
          entityId: checklist.id.toString(),
          placeholders: {
            userName: userId,
            itemTitle: completedItem?.title ?? itemId,
          },
          newData: { itemId, progress: checklist.progress },
        });

        return reply.status(200).send({
          checklist: onboardingChecklistToDTO(checklist),
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
