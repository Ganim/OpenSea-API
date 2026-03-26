import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeMarkAsReadUseCase } from '@/use-cases/sales/conversations/factories/make-mark-as-read-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function markAsReadController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/conversations/:id/read',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONVERSATIONS.ACCESS,
        resource: 'conversations',
      }),
    ],
    schema: {
      tags: ['Sales - Conversations'],
      summary: 'Mark all messages in a conversation as read',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;
      const tenantId = request.user.tenantId!;

      try {
        const useCase = makeMarkAsReadUseCase();
        await useCase.execute({ tenantId, conversationId: id });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
