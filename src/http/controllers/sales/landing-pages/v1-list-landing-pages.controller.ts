import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { landingPageResponseSchema } from '@/http/schemas/sales/landing-pages/landing-page.schema';
import { makeListLandingPagesUseCase } from '@/use-cases/sales/landing-pages/factories/make-list-landing-pages-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listLandingPagesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/landing-pages',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LANDING_PAGES.ACCESS,
        resource: 'landing-pages',
      }),
    ],
    schema: {
      tags: ['Sales - Landing Pages'],
      summary: 'List landing pages',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        perPage: z.coerce.number().int().positive().max(100).default(20),
        status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
      }),
      response: {
        200: z.object({
          landingPages: z.array(landingPageResponseSchema),
          total: z.number(),
          page: z.number(),
          perPage: z.number(),
          totalPages: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const query = request.query;
      const tenantId = request.user.tenantId!;

      const useCase = makeListLandingPagesUseCase();
      const result = await useCase.execute({ tenantId, ...query });

      return reply.status(200).send(result as any);
    },
  });
}
