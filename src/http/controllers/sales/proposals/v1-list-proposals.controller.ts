import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { proposalResponseSchema } from '@/http/schemas/sales/proposals/proposal.schema';
import { makeListProposalsUseCase } from '@/use-cases/sales/proposals/factories/make-list-proposals-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listProposalsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/proposals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.PROPOSALS.ACCESS,
        resource: 'proposals',
      }),
    ],
    schema: {
      tags: ['Sales - Proposals'],
      summary: 'List proposals with pagination and filters',
      querystring: z.object({
        page: z.coerce.number().min(1).default(1),
        limit: z.coerce.number().min(1).max(100).default(20),
        status: z.string().optional(),
        customerId: z.string().uuid().optional(),
      }),
      response: {
        200: z.object({
          proposals: z.array(proposalResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, status, customerId } = request.query;

      const useCase = makeListProposalsUseCase();
      const { proposals, total, totalPages } = await useCase.execute({
        tenantId,
        page,
        perPage: limit,
        status: status as any,
        customerId,
      });

      return reply.status(200).send({
        proposals,
        meta: {
          total,
          page,
          limit,
          pages: totalPages,
        },
      } as any);
    },
  });
}
