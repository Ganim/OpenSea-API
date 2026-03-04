import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUnprotectItemUseCase } from '@/use-cases/storage/security/factories/make-unprotect-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function unprotectItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/security/unprotect',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STORAGE.SECURITY.MANAGE,
        resource: 'storage-security',
      }),
    ],
    schema: {
      tags: ['Storage - Security'],
      summary: 'Remove password protection from a file or folder',
      body: z.object({
        itemId: z.string().uuid(),
        itemType: z.enum(['file', 'folder']),
        password: z.string().min(1),
      }),
      response: {
        200: z.object({
          message: z.string(),
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { itemId, itemType, password } = request.body;

      try {
        const useCase = makeUnprotectItemUseCase();
        await useCase.execute({ tenantId, itemId, itemType, password });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.ITEM_UNPROTECT,
          entityId: itemId,
          placeholders: {
            itemType: itemType === 'file' ? 'arquivo' : 'pasta',
            itemName: itemId,
          },
        });

        return reply.status(200).send({
          message: `Proteção por senha removida do ${itemType === 'file' ? 'arquivo' : 'pasta'}`,
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
