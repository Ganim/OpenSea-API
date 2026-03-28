import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { offboardingChecklistResponseSchema } from '@/http/schemas/hr/offboarding';
import { offboardingChecklistToDTO } from '@/mappers/hr/offboarding-checklist';
import { makeGetOffboardingChecklistUseCase } from '@/use-cases/hr/offboarding/factories/make-get-offboarding-checklist-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetOffboardingChecklistController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/offboarding/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OFFBOARDING.ACCESS,
        resource: 'offboarding',
      }),
    ],
    schema: {
      tags: ['HR - Offboarding'],
      summary: 'Get offboarding checklist by ID',
      description: 'Returns a single offboarding checklist by its ID',
      params: z.object({
        id: idSchema,
      }),
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

      try {
        const getOffboardingChecklistUseCase =
          makeGetOffboardingChecklistUseCase();
        const { checklist } = await getOffboardingChecklistUseCase.execute({
          tenantId,
          id,
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
