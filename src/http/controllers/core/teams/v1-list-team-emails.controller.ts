import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { teamEmailAccountResponseSchema } from '@/http/schemas/core/teams';
import { makeListTeamEmailsUseCase } from '@/use-cases/core/teams/factories/make-list-team-emails';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTeamEmailsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/teams/:teamId/emails',
    onRequest: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.USERS.ADMIN,
        resource: 'teams',
      }),
    ],
    schema: {
      tags: ['Core - Teams'],
      summary: 'Listar contas de email vinculadas ao time',
      security: [{ bearerAuth: [] }],
      params: z.object({ teamId: z.string().uuid() }),
      response: {
        200: z.object({
          emailAccounts: z.array(teamEmailAccountResponseSchema),
        }),
        403: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { teamId } = request.params;

      try {
        const useCase = makeListTeamEmailsUseCase();
        const result = await useCase.execute({
          tenantId,
          teamId,
          requestingUserId: userId,
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
