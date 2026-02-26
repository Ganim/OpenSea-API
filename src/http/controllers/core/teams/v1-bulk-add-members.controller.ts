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
  addTeamMembersSchema,
  teamMemberResponseSchema,
} from '@/http/schemas/core/teams';
import { makeBulkAddTeamMembersUseCase } from '@/use-cases/core/teams/factories/make-bulk-add-team-members';
import { makeGetTeamByIdUseCase } from '@/use-cases/core/teams/factories/make-get-team-by-id';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function bulkAddTeamMembersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/teams/:teamId/members/bulk',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.MEMBERS.ADD,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Add multiple members to a team at once',
      security: [{ bearerAuth: [] }],
      params: z.object({ teamId: z.string().uuid() }),
      body: addTeamMembersSchema,
      response: {
        200: z.object({
          added: z.array(teamMemberResponseSchema),
          skipped: z.array(z.string()),
        }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId } = request.params;
      const { members } = request.body;

      try {
        const [{ user }, { team }] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetTeamByIdUseCase().execute({ tenantId, teamId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const useCase = makeBulkAddTeamMembersUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          members,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_MEMBERS_BULK_ADD,
          entityId: teamId,
          placeholders: { userName, count: result.added.length, teamName: team.name, teamColor: team.color },
          newData: { addedCount: result.added.length, skippedCount: result.skipped.length },
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
