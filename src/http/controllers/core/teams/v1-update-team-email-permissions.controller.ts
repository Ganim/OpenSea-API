import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateTeamEmailPermissionsSchema,
  teamEmailAccountResponseSchema,
} from '@/http/schemas/core/teams';
import { makeUpdateTeamEmailPermissionsUseCase } from '@/use-cases/core/teams/factories/make-update-team-email-permissions';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTeamEmailPermissionsController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/teams/:teamId/emails/:accountId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.EMAILS.MANAGE,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Atualizar permissões de email do time',
      security: [{ bearerAuth: [] }],
      params: z.object({
        teamId: z.string().uuid(),
        accountId: z.string().uuid(),
      }),
      body: updateTeamEmailPermissionsSchema,
      response: {
        200: z.object({ teamEmail: teamEmailAccountResponseSchema }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId, accountId } = request.params;

      try {
        const useCase = makeUpdateTeamEmailPermissionsUseCase();
        const result = await useCase.execute({
          tenantId,
          teamId,
          accountId,
          requestingUserId: userId,
          ...request.body,
        });

        return reply.status(200).send(result);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof ForbiddenError) {
          return reply.status(403).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
