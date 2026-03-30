import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  suggestCategoryQuerySchema,
  suggestCategoryResponseSchema,
} from '@/http/schemas/finance';
import { makeSuggestCategoryUseCase } from '@/use-cases/finance/entries/factories/make-suggest-category-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function suggestCategoryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/finance/entries/suggest-category',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.FINANCE.ENTRIES.ACCESS,
        resource: 'entries',
      }),
    ],
    schema: {
      tags: ['Finance - Entries'],
      summary: 'Suggest category for a finance entry based on historical data',
      description:
        'Analyzes historical entries to suggest the most likely category based on supplier name and/or description keywords. Returns up to 3 suggestions with confidence scores.',
      security: [{ bearerAuth: [] }],
      querystring: suggestCategoryQuerySchema,
      response: {
        200: suggestCategoryResponseSchema,
        400: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const { supplierName, description } = request.query as {
        supplierName?: string;
        description?: string;
      };

      const tenantId = request.user.tenantId!;

      const useCase = makeSuggestCategoryUseCase();
      const { suggestions } = await useCase.execute({
        tenantId,
        supplierName,
        description,
      });

      return reply.status(200).send({ suggestions });
    },
  });
}
