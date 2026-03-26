import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas';
import { makeRemoveCipaMemberUseCase } from '@/use-cases/hr/cipa-members/factories/make-remove-cipa-member-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RemoveCipaMemberController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/cipa-mandates/:mandateId/members/:memberId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SAFETY.ADMIN,
        resource: 'cipa-members',
      }),
    ],
    schema: {
      tags: ['HR - CIPA'],
      summary: 'Remove CIPA member',
      description: 'Removes a member from a CIPA mandate',
      params: z.object({
        mandateId: idSchema,
        memberId: idSchema,
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
      const { memberId } = request.params;

      try {
        const useCase = makeRemoveCipaMemberUseCase();
        await useCase.execute({ tenantId, memberId });

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
