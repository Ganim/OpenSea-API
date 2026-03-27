import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { landingPageResponseSchema } from '@/http/schemas/sales/landing-pages/landing-page.schema';
import { makePublishLandingPageUseCase } from '@/use-cases/sales/landing-pages/factories/make-publish-landing-page-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function publishLandingPageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/sales/landing-pages/:landingPageId/publish',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LANDING_PAGES.ADMIN,
        resource: 'landing-pages',
      }),
    ],
    schema: {
      tags: ['Sales - Landing Pages'],
      summary: 'Publish a landing page (DRAFT -> PUBLISHED)',
      params: z.object({
        landingPageId: z.string().uuid(),
      }),
      response: {
        200: z.object({ landingPage: landingPageResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { landingPageId } = request.params;

      try {
        const useCase = makePublishLandingPageUseCase();
        const { landingPage } = await useCase.execute({
          tenantId,
          landingPageId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LANDING_PAGE_PUBLISH,
          entityId: landingPage.id,
          placeholders: { userName: userId, pageTitle: landingPage.title },
          newData: { status: 'PUBLISHED' },
        });

        return reply.status(200).send({ landingPage } as any);
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
