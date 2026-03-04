import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { SetUserSecurityKeyUseCase } from '@/use-cases/core/tenants/set-user-security-key';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function setUserSecurityKeyAdminController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/admin/tenants/:tenantId/users/:userId/security-key',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Tenants'],
      summary: 'Set or remove a user security key (super admin)',
      params: z.object({
        tenantId: z.string().uuid(),
        userId: z.string().uuid(),
      }),
      body: z.object({
        securityKey: z.string().min(4).max(100).nullable(),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { tenantId, userId } = request.params;
      const { securityKey } = request.body;

      try {
        const useCase = new SetUserSecurityKeyUseCase();
        await useCase.execute({ tenantId, userId, securityKey });

        const action = securityKey ? 'definida' : 'removida';
        return reply.status(200).send({
          message: `Chave de segurança ${action} com sucesso`,
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
