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
  changeTeamMemberRoleSchema,
  teamMemberResponseSchema,
} from '@/http/schemas/core/teams';
import { makeChangeTeamMemberRoleUseCase } from '@/use-cases/core/teams/factories/make-change-team-member-role';
import { makeGetTeamByIdUseCase } from '@/use-cases/core/teams/factories/make-get-team-by-id';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Proprietário',
  ADMIN: 'Administrador',
  MEMBER: 'Membro',
};

export async function changeTeamMemberRoleController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/teams/:teamId/members/:memberId/role',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.MEMBERS.MANAGE,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Change the role of a team member',
      security: [{ bearerAuth: [] }],
      params: z.object({
        teamId: z.string().uuid(),
        memberId: z.string().uuid(),
      }),
      body: changeTeamMemberRoleSchema,
      response: {
        200: z.object({ member: teamMemberResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId, memberId } = request.params;
      const { role } = request.body;

      try {
        const [{ user }, { team }] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetTeamByIdUseCase().execute({ tenantId, teamId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        // The old role is the opposite of the new one (only ADMIN <-> MEMBER changes allowed)
        const oldRole = role === 'ADMIN' ? 'MEMBER' : 'ADMIN';

        const useCase = makeChangeTeamMemberRoleUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          memberId,
          role,
        });

        // Resolve the member's name
        let memberName = memberId;
        try {
          const { user: memberUser } = await makeGetUserByIdUseCase().execute({
            userId: result.member.userId,
          });
          memberName = memberUser.profile?.name
            ? `${memberUser.profile.name} ${memberUser.profile.surname || ''}`.trim()
            : memberUser.username || memberUser.email;
        } catch {
          // fallback to memberId
        }

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_MEMBER_ROLE_CHANGE,
          entityId: memberId,
          placeholders: {
            userName,
            memberName,
            oldRole: ROLE_LABELS[oldRole] || oldRole,
            newRole: ROLE_LABELS[role] || role,
            teamName: team.name,
            teamColor: team.color,
          },
          newData: { memberId, role },
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
