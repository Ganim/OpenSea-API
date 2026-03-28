import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createOnboardingChecklistSchema,
  onboardingChecklistResponseSchema,
} from '@/http/schemas/hr/onboarding';
import { onboardingChecklistToDTO } from '@/mappers/hr/onboarding-checklist';
import { makeCreateOnboardingChecklistUseCase } from '@/use-cases/hr/onboarding/factories/make-create-onboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateOnboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/onboarding',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONBOARDING.REGISTER,
        resource: 'onboarding',
      }),
    ],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'Create onboarding checklist',
      description:
        'Creates an onboarding checklist for an employee with default or custom items',
      body: createOnboardingChecklistSchema,
      response: {
        201: z.object({
          checklist: onboardingChecklistResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId, title, items } = request.body;

      try {
        const createOnboardingChecklistUseCase =
          makeCreateOnboardingChecklistUseCase();
        const { checklist } = await createOnboardingChecklistUseCase.execute({
          tenantId,
          employeeId,
          title,
          items,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.ONBOARDING_CREATE,
          entityId: checklist.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: employeeId,
          },
          newData: {
            id: checklist.id.toString(),
            employeeId,
            title: checklist.title,
            itemCount: checklist.items.length,
          },
        });

        return reply.status(201).send({
          checklist: onboardingChecklistToDTO(checklist),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
