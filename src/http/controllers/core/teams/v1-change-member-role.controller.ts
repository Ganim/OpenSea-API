import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  changeTeamMemberRoleSchema,
  teamMemberResponseSchema,
} from '@/http/schemas/core/teams';
import { makeChangeTeamMemberRoleUseCase } from '@/use-cases/core/teams/factories/make-change-team-member-role';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

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
        const useCase = makeChangeTeamMemberRoleUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          memberId,
          role,
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
