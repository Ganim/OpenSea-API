import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTeamSchema,
  teamResponseSchema,
} from '@/http/schemas/core/teams';
import { makeCreateTeamUseCase } from '@/use-cases/core/teams/factories/make-create-team';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createTeamController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/teams',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.CREATE,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Create a new team',
      security: [{ bearerAuth: [] }],
      body: createTeamSchema,
      response: {
        201: z.object({ team: teamResponseSchema }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const { name, description, color, avatarUrl } = request.body;
        const useCase = makeCreateTeamUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          name,
          description: description ?? undefined,
          color: color ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        });

        return reply.status(201).send(result);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
