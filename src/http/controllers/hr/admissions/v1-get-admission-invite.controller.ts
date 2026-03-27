import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac/permission-codes';
import { createPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { admissionInviteResponseSchema } from '@/http/schemas/hr/admission';
import { makeGetAdmissionInviteUseCase } from '@/use-cases/hr/admissions/factories/make-get-admission-invite-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetAdmissionInviteController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/admissions/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ADMISSIONS.ACCESS,
      }),
    ],
    schema: {
      tags: ['HR - Admissions'],
      summary: 'Get admission invite by ID',
      params: z.object({ id: z.string().uuid() }),
      response: {
        200: z.object({ invite: admissionInviteResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeGetAdmissionInviteUseCase();
        const { invite } = await useCase.execute({
          tenantId,
          inviteId: id,
        });

        return reply.status(200).send({ invite });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
