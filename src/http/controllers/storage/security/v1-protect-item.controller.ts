import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeProtectItemUseCase } from '@/use-cases/storage/security/factories/make-protect-item-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function protectItemController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/storage/security/protect',
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
      summary: 'Protect a file or folder with a password',
      body: z.object({
        itemId: z.string().uuid(),
        itemType: z.enum(['file', 'folder']),
        password: z.string().min(4).max(100),
      }),
      response: {
        200: z.object({
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
        const useCase = makeProtectItemUseCase();
        await useCase.execute({ tenantId, itemId, itemType, password });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STORAGE.ITEM_PROTECT,
          entityId: itemId,
          placeholders: {
            itemType: itemType === 'file' ? 'arquivo' : 'pasta',
            itemName: itemId,
          },
        });

        return reply.status(200).send({
          message: `${itemType === 'file' ? 'Arquivo' : 'Pasta'} protegido(a) com senha`,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
