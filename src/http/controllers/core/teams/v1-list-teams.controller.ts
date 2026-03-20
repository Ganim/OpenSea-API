import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { teamResponseSchema } from '@/http/schemas/core/teams';
import { makeListTeamsUseCase } from '@/use-cases/core/teams/factories/make-list-teams';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listTeamsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/teams',
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
      summary: 'List teams',
      security: [{ bearerAuth: [] }],
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
        search: z.string().optional(),
        isActive: z.coerce.boolean().optional(),
      }),
      response: {
        200: z.object({
          data: z.array(teamResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, search, isActive } = request.query;

      try {
        const useCase = makeListTeamsUseCase();
        const result = await useCase.execute({
          tenantId,
          page,
          limit,
          search,
          isActive,
        });

        const { teams, total } = result;

        return reply.status(200).send({
          data: teams,
          meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
