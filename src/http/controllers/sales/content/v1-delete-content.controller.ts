import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeDeleteGeneratedContentUseCase } from '@/use-cases/sales/generated-contents/factories/make-delete-generated-content-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteContentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/content/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.CONTENT.REMOVE,
        resource: 'content',
      }),
    ],
    schema: {
      tags: ['Sales - Content'],
      summary: 'Delete generated content',
      params: z.object({ id: z.string().uuid() }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id } = request.params;

      const useCase = makeDeleteGeneratedContentUseCase();
      await useCase.execute({ contentId: id, tenantId });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.CONTENT_DELETE,
        entityId: id,
        placeholders: { userName: userId, contentTitle: id },
      });

      return reply.status(204).send(null);
    },
  });
}
