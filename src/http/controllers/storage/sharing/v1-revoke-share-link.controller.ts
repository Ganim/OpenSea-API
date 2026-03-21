import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeRevokeShareLinkUseCase } from '@/use-cases/storage/sharing/factories/make-revoke-share-link-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function revokeShareLinkController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/storage/shares/:linkId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.TOOLS.STORAGE.FILES.MODIFY,
        resource: 'storage-files',
      }),
    ],
    schema: {
      tags: ['Storage - Sharing'],
      summary: 'Revoke a share link',
      params: z.object({
        linkId: z.string().uuid(),
      }),
      response: {
        204: z.null(),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { linkId } = request.params;

      try {
        const revokeShareLinkUseCase = makeRevokeShareLinkUseCase();
        await revokeShareLinkUseCase.execute({
          tenantId,
          linkId,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.SHARE_LINK_REVOKED,
          entityId: linkId,
          placeholders: {
            userName: request.user.sub,
            fileName: linkId,
          },
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
