import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { prisma } from '@/lib/prisma';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCouponController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/coupons/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.COUPONS.REMOVE,
        resource: 'coupons',
      }),
    ],
    schema: {
      tags: ['Sales - Coupons'],
      summary: 'Delete a coupon',
      params: z.object({
        id: z.string().uuid().describe('Coupon UUID'),
      }),
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

      const existing = await prisma.coupon.findFirst({
        where: { id, tenantId },
      });

      if (!existing) {
        return reply.status(404).send({ message: 'Coupon not found' });
      }

      await prisma.coupon.delete({ where: { id } });

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.COUPON_DELETE,
        entityId: id,
        placeholders: {
          userName: userId,
          couponCode: existing.code,
        },
        oldData: { code: existing.code, type: existing.type },
      });

      return reply.status(204).send(null);
    },
  });
}
