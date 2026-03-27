import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetLandingPageByIdUseCase } from '@/use-cases/sales/landing-pages/factories/make-get-landing-page-by-id-use-case';
import { makeDeleteLandingPageUseCase } from '@/use-cases/sales/landing-pages/factories/make-delete-landing-page-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function deleteLandingPageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/sales/landing-pages/:landingPageId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LANDING_PAGES.REMOVE,
        resource: 'landing-pages',
      }),
    ],
    schema: {
      tags: ['Sales - Landing Pages'],
      summary: 'Delete a landing page (soft delete)',
      params: z.object({
        landingPageId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const { landingPageId } = request.params;

      try {
        // Get the page first for audit logging
        const getUseCase = makeGetLandingPageByIdUseCase();
        const { landingPage } = await getUseCase.execute({
          tenantId,
          landingPageId,
        });

        const deleteUseCase = makeDeleteLandingPageUseCase();
        await deleteUseCase.execute({ tenantId, landingPageId });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LANDING_PAGE_DELETE,
          entityId: landingPageId,
          placeholders: {
            userName: userId,
            pageTitle: landingPage.title,
          },
          oldData: {
            title: landingPage.title,
            slug: landingPage.slug,
          },
        });

        return reply.status(204).send();
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
