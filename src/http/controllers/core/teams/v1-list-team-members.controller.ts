import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { teamMemberResponseSchema } from '@/http/schemas/core/teams';
import { makeListTeamMembersUseCase } from '@/use-cases/core/teams/factories/make-list-team-members';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTeamMembersController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/teams/:teamId/members',
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
      summary: 'List members of a team',
      security: [{ bearerAuth: [] }],
      params: z.object({ teamId: z.string().uuid() }),
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        role: z.enum(['OWNER', 'ADMIN', 'MEMBER']).optional(),
        search: z.string().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(teamMemberResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { teamId } = request.params;
      const { page, limit, role, search } = request.query;

      try {
        const useCase = makeListTeamMembersUseCase();
        const result = await useCase.execute({
          teamId,
          tenantId,
          page,
          limit,
          role,
          search,
        });

        const { members, total } = result;

        return reply.status(200).send({
          data: members,
          meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
