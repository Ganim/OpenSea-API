import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  addTeamMembersSchema,
  teamMemberResponseSchema,
} from '@/http/schemas/core/teams';
import { makeBulkAddTeamMembersUseCase } from '@/use-cases/core/teams/factories/make-bulk-add-team-members';
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
        const useCase = makeBulkAddTeamMembersUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          members,
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
