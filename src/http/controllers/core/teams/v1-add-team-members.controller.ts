import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { teamMemberResponseSchema } from '@/http/schemas/core/teams';
import { makeAddTeamMemberUseCase } from '@/use-cases/core/teams/factories/make-add-team-member';
import { makeGetTeamByIdUseCase } from '@/use-cases/core/teams/factories/make-get-team-by-id';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function addTeamMembersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/teams/:teamId/members',
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
      summary: 'Add a member to a team',
      security: [{ bearerAuth: [] }],
      params: z.object({ teamId: z.string().uuid() }),
      body: z.object({
        userId: z.string().uuid(),
        role: z.enum(['ADMIN', 'MEMBER']).optional(),
      }),
      response: {
        201: z.object({ member: teamMemberResponseSchema }),
        400: z.object({ message: z.string() }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId } = request.params;
      const { userId: targetUserId, role } = request.body;

      try {
        const [{ user: requestingUser }, { user: targetUser }, { team }] =
          await Promise.all([
            makeGetUserByIdUseCase().execute({ userId }),
            makeGetUserByIdUseCase().execute({ userId: targetUserId }),
            makeGetTeamByIdUseCase().execute({ tenantId, teamId }),
          ]);
        const userName = requestingUser.profile?.name
          ? `${requestingUser.profile.name} ${requestingUser.profile.surname || ''}`.trim()
          : requestingUser.username || requestingUser.email;
        const memberName = targetUser.profile?.name
          ? `${targetUser.profile.name} ${targetUser.profile.surname || ''}`.trim()
          : targetUser.username || targetUser.email;

        const useCase = makeAddTeamMemberUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          userId: targetUserId,
          role,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_MEMBER_ADD,
          entityId: result.member.id,
          placeholders: {
            userName,
            memberName,
            teamName: team.name,
            teamColor: team.color,
          },
          newData: { userId: targetUserId, role: role ?? 'MEMBER' },
          affectedUserId: targetUserId,
        });

        return reply.status(201).send(result);
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
