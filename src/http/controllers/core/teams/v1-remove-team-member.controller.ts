import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetTeamByIdUseCase } from '@/use-cases/core/teams/factories/make-get-team-by-id';
import { makeListTeamMembersUseCase } from '@/use-cases/core/teams/factories/make-list-team-members';
import { makeRemoveTeamMemberUseCase } from '@/use-cases/core/teams/factories/make-remove-team-member';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function removeTeamMemberController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/teams/:teamId/members/:memberId',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.MEMBERS.REMOVE,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Remove a member from a team',
      security: [{ bearerAuth: [] }],
      params: z.object({
        teamId: z.string().uuid(),
        memberId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId, memberId } = request.params;

      try {
        const [{ user }, { team }, { members }] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetTeamByIdUseCase().execute({ tenantId, teamId }),
          makeListTeamMembersUseCase().execute({
            tenantId,
            teamId,
            page: 1,
            limit: 100,
          }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        // Resolve the member's name before removing
        const memberData = members.find((m) => m.id === memberId);
        const memberName = memberData?.userName || memberId;

        const useCase = makeRemoveTeamMemberUseCase();
        await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          memberId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_MEMBER_REMOVE,
          entityId: memberId,
          placeholders: {
            userName,
            memberName,
            teamName: team.name,
            teamColor: team.color,
          },
          oldData: { memberId, teamId },
          affectedUserId: memberData?.userId,
        });

        return reply.status(204).send(null);
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
