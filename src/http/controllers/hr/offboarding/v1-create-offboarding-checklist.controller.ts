import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createOffboardingChecklistSchema,
  offboardingChecklistResponseSchema,
} from '@/http/schemas/hr/offboarding';
import { offboardingChecklistToDTO } from '@/mappers/hr/offboarding-checklist';
import { makeCreateOffboardingChecklistUseCase } from '@/use-cases/hr/offboarding/factories/make-create-offboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateOffboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/offboarding',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OFFBOARDING.REGISTER,
        resource: 'offboarding',
      }),
    ],
    schema: {
      tags: ['HR - Offboarding'],
      summary: 'Create offboarding checklist',
      description:
        'Creates an offboarding checklist for an employee with default or custom items',
      body: createOffboardingChecklistSchema,
      response: {
        201: z.object({
          checklist: offboardingChecklistResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId, terminationId, title, items } = request.body;

      try {
        const createOffboardingChecklistUseCase =
          makeCreateOffboardingChecklistUseCase();
        const { checklist } = await createOffboardingChecklistUseCase.execute({
          tenantId,
          employeeId,
          terminationId,
          title,
          items,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.OFFBOARDING_CREATE,
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
          checklist: offboardingChecklistToDTO(checklist),
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
