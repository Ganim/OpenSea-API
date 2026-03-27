import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createLandingPageSchema,
  landingPageResponseSchema,
} from '@/http/schemas/sales/landing-pages/landing-page.schema';
import { makeCreateLandingPageUseCase } from '@/use-cases/sales/landing-pages/factories/make-create-landing-page-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function createLandingPageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/sales/landing-pages',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.LANDING_PAGES.REGISTER,
        resource: 'landing-pages',
      }),
    ],
    schema: {
      tags: ['Sales - Landing Pages'],
      summary: 'Create a new landing page',
      body: createLandingPageSchema,
      response: {
        201: z.object({ landingPage: landingPageResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const userId = request.user.sub;
      const tenantId = request.user.tenantId!;
      const body = request.body;

      try {
        const useCase = makeCreateLandingPageUseCase();
        const { landingPage } = await useCase.execute({
          tenantId,
          title: body.title,
          slug: body.slug,
          description: body.description,
          template: body.template,
          content: body.content,
          formId: body.formId,
          createdBy: userId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.LANDING_PAGE_CREATE,
          entityId: landingPage.id,
          placeholders: { userName: userId, pageTitle: landingPage.title },
          newData: {
            title: landingPage.title,
            slug: landingPage.slug,
            template: landingPage.template,
          },
        });

        return reply.status(201).send({ landingPage } as any);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
