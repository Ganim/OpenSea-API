import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeUpdateCentralUserRoleUseCase } from '@/use-cases/admin/team/factories/make-update-central-user-role';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentCentralUser } from './presenters';

export async function v1UpdateCentralUserRoleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/admin/team/:userId/role',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Team'],
      summary: 'Update central user role (super admin)',
      description:
        'Updates the role of a Central team member. Only OWNERs can promote to OWNER or ADMIN. Cannot demote the last OWNER.',
      params: z.object({
        userId: z.string().uuid(),
      }),
      body: z.object({
        role: z.enum(['OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'VIEWER']),
      }),
      response: {
        200: z.object({
          centralUser: z.record(z.string(), z.unknown()),
        }),
        400: z.object({
          message: z.string(),
        }),
        403: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { userId } = request.params;
      const { role } = request.body;

      try {
        const updateCentralUserRoleUseCase = makeUpdateCentralUserRoleUseCase();
        const { centralUser } = await updateCentralUserRoleUseCase.execute({
          userId,
          newRole: role,
          updatedBy: request.user.sub,
        });

        return reply.status(200).send({
          centralUser: presentCentralUser(centralUser),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
