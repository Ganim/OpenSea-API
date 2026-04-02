import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cuidSchema } from '@/http/schemas/common.schema';
import { onboardingChecklistResponseSchema } from '@/http/schemas/hr/onboarding';
import { onboardingChecklistToDTO } from '@/mappers/hr/onboarding-checklist';
import { makeGetOnboardingChecklistUseCase } from '@/use-cases/hr/onboarding/factories/make-get-onboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetOnboardingChecklistController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/onboarding/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ONBOARDING.ACCESS,
        resource: 'onboarding',
      }),
    ],
    schema: {
      tags: ['HR - Onboarding'],
      summary: 'Get onboarding checklist by ID',
      description: 'Returns a single onboarding checklist by its ID',
      params: z.object({
        id: cuidSchema,
      }),
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

      try {
        const getOnboardingChecklistUseCase =
          makeGetOnboardingChecklistUseCase();
        const { checklist } = await getOnboardingChecklistUseCase.execute({
          tenantId,
          id,
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
