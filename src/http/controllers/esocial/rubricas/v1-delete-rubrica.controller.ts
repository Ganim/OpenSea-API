import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeDeleteRubricaUseCase } from '@/use-cases/esocial/rubricas/factories/make-delete-rubrica';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteRubricaController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/esocial/rubricas/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ESOCIAL.RUBRICAS.REMOVE,
        resource: 'esocial-rubricas',
      }),
    ],
    schema: {
      tags: ['eSocial - Rubricas'],
      summary: 'Delete rubrica',
      description: 'Delete an eSocial rubrica.',
      params: z.object({ id: idSchema }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params;

      try {
        const useCase = makeDeleteRubricaUseCase();
        await useCase.execute({
          tenantId,
          rubricaId: id,
        });

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
