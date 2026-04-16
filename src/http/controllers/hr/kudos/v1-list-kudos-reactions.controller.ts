import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListKudosReactionsUseCase } from '@/use-cases/hr/kudos/factories/make-list-kudos-reactions-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListKudosReactionsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/kudos/:id/reactions',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.KUDOS.ACCESS,
        resource: 'kudos',
      }),
    ],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'List reactions for a kudos',
      description:
        'Returns reactions grouped by emoji with count and a sample of employees who reacted.',
      params: z.object({ id: z.string() }),
      response: {
        200: z.object({
          groups: z.array(
            z.object({
              emoji: z.string(),
              count: z.number().int().nonnegative(),
              employeeIds: z.array(z.string()),
            }),
          ),
          totalReactions: z.number().int().nonnegative(),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const kudosId = request.params.id;

      try {
        const listKudosReactionsUseCase = makeListKudosReactionsUseCase();
        const { groups, totalReactions } =
          await listKudosReactionsUseCase.execute({ tenantId, kudosId });

        return reply.status(200).send({ groups, totalReactions });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
