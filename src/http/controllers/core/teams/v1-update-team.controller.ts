import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateTeamSchema,
  teamResponseSchema,
} from '@/http/schemas/core/teams';
import { makeGetTeamByIdUseCase } from '@/use-cases/core/teams/factories/make-get-team-by-id';
import { makeUpdateTeamUseCase } from '@/use-cases/core/teams/factories/make-update-team';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function updateTeamController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/teams/:teamId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.UPDATE,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Update a team',
      security: [{ bearerAuth: [] }],
      params: z.object({ teamId: z.string().uuid() }),
      body: updateTeamSchema,
      response: {
        200: z.object({ team: teamResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId } = request.params;

      try {
        const { name, description, color, avatarUrl } = request.body;

        const { user } = await makeGetUserByIdUseCase().execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        // Captura estado anterior para o log
        const { team: oldTeam } = await makeGetTeamByIdUseCase().execute({ tenantId, teamId });

        const useCase = makeUpdateTeamUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          userId,
          name: name ?? undefined,
          description: description ?? undefined,
          color: color ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_UPDATE,
          entityId: teamId,
          placeholders: { userName, teamName: result.team.name, teamColor: result.team.color },
          oldData: { name: oldTeam.name, description: oldTeam.description, color: oldTeam.color },
          newData: { name, description, color, avatarUrl },
        });

        return reply.status(200).send(result);
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
