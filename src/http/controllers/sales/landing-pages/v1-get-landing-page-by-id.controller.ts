import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { landingPageResponseSchema } from '@/http/schemas/sales/landing-pages/landing-page.schema';
import { makeGetLandingPageByIdUseCase } from '@/use-cases/sales/landing-pages/factories/make-get-landing-page-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getLandingPageByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/sales/landing-pages/:landingPageId',
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
      summary: 'Get a landing page by ID',
      params: z.object({
        landingPageId: z.string().uuid(),
      }),
      response: {
        200: z.object({ landingPage: landingPageResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { landingPageId } = request.params;

      try {
        const useCase = makeGetLandingPageByIdUseCase();
        const result = await useCase.execute({ tenantId, landingPageId });

        return reply.status(200).send(result as any);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
