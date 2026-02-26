import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTeamSchema,
  teamResponseSchema,
} from '@/http/schemas/core/teams';
import { makeCreateTeamUseCase } from '@/use-cases/core/teams/factories/make-create-team';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
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

        const { user } = await makeGetUserByIdUseCase().execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeCreateTeamUseCase();
        const result = await useCase.execute({
          tenantId,
          userId,
          name,
          description: description ?? undefined,
          color: color ?? undefined,
          avatarUrl: avatarUrl ?? undefined,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_CREATE,
          entityId: result.team.id,
          placeholders: { userName, teamName: name, teamColor: color },
          newData: { name, description, color, avatarUrl },
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
