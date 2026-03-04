import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { transferOwnershipSchema } from '@/http/schemas/core/teams';
import { makeGetTeamByIdUseCase } from '@/use-cases/core/teams/factories/make-get-team-by-id';
import { makeTransferTeamOwnershipUseCase } from '@/use-cases/core/teams/factories/make-transfer-team-ownership';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function transferTeamOwnershipController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/teams/:teamId/transfer-ownership',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.CORE.TEAMS.MANAGE,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Transfer team ownership to another member',
      security: [{ bearerAuth: [] }],
      params: z.object({ teamId: z.string().uuid() }),
      body: transferOwnershipSchema,
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
      const { teamId } = request.params;
      const { userId: newOwnerUserId } = request.body;

      try {
        const [{ user }, { user: newOwner }, { team }] = await Promise.all([
          makeGetUserByIdUseCase().execute({ userId }),
          makeGetUserByIdUseCase().execute({ userId: newOwnerUserId }),
          makeGetTeamByIdUseCase().execute({ tenantId, teamId }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;
        const newOwnerName = newOwner.profile?.name
          ? `${newOwner.profile.name} ${newOwner.profile.surname || ''}`.trim()
          : newOwner.username || newOwner.email;

        const useCase = makeTransferTeamOwnershipUseCase();
        await useCase.execute({
          teamId,
          tenantId,
          requestingUserId: userId,
          newOwnerUserId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.CORE.TEAM_OWNERSHIP_TRANSFER,
          entityId: teamId,
          placeholders: {
            userName,
            newOwnerName,
            teamName: team.name,
            teamColor: team.color,
          },
          oldData: { ownerId: userId },
          newData: { ownerId: newOwnerUserId },
          affectedUserId: newOwnerUserId,
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
