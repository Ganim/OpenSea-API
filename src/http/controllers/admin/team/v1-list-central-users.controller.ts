import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeListCentralUsersUseCase } from '@/use-cases/admin/team/factories/make-list-central-users';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentCentralUser } from './presenters';

export async function v1ListCentralUsersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/team',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Team'],
      summary: 'List central team users (super admin)',
      description:
        'Lists all users in the Central team. Optionally filter by role.',
      querystring: z.object({
        role: z
          .enum(['OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'VIEWER'])
          .optional(),
      }),
      response: {
        200: z.object({
          users: z.array(z.record(z.string(), z.unknown())),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { role } = request.query;

      const listCentralUsersUseCase = makeListCentralUsersUseCase();
      const { users } = await listCentralUsersUseCase.execute({ role });

      const formattedUsers = users.map(presentCentralUser);

      return reply.status(200).send({ users: formattedUsers });
    },
  });
}
