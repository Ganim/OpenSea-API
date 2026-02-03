import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeDeleteVariantUseCase } from '@/use-cases/stock/variants/factories/make-delete-variant-use-case';
import { makeGetVariantByIdUseCase } from '@/use-cases/stock/variants/factories/make-get-variant-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteVariantController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/variants/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.STOCK.VARIANTS.DELETE,
        resource: 'variants',
      }),
    ],
    schema: {
      tags: ['Stock - Variants'],
      summary: 'Delete a variant (soft delete)',
      params: z.object({
        id: z.uuid(),
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
      const { id } = request.params;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getVariantByIdUseCase = makeGetVariantByIdUseCase();

        const [{ user }, variant] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getVariantByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deleteVariantUseCase = makeDeleteVariantUseCase();
        await deleteVariantUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.STOCK.VARIANT_DELETE,
          entityId: id,
          placeholders: { userName, variantName: variant.name },
          oldData: {
            id: variant.id.toString(),
            name: variant.name,
            sku: variant.sku,
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
