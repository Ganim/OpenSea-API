import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifySuperAdmin } from '@/http/middlewares/rbac/verify-super-admin';
import { makeInviteCentralUserUseCase } from '@/use-cases/admin/team/factories/make-invite-central-user';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import { presentCentralUser } from './presenters';

export async function v1InviteCentralUserController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/team/invite',
    preHandler: [verifyJwt, verifySuperAdmin],
    schema: {
      tags: ['Admin - Team'],
      summary: 'Invite user to central team (super admin)',
      description:
        'Invites an existing user to the Central team with a specific role. The user must exist and must not already be a team member.',
      body: z.object({
        userId: z.string().uuid(),
        role: z.enum(['OWNER', 'ADMIN', 'SUPPORT', 'FINANCE', 'VIEWER']),
      }),
      response: {
        201: z.object({
          centralUser: z.record(z.string(), z.unknown()),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
        409: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { userId, role } = request.body;

      try {
        const inviteCentralUserUseCase = makeInviteCentralUserUseCase();
        const { centralUser } = await inviteCentralUserUseCase.execute({
          userId,
          role,
          invitedBy: request.user.sub,
        });

        return reply.status(201).send({
          centralUser: presentCentralUser(centralUser),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ConflictError) {
          return reply.status(409).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
