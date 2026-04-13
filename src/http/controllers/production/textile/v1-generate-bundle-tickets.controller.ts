import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  generateBundleTicketsSchema,
  bundleTicketsResponseSchema,
} from '@/http/schemas/production/textile.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGenerateBundleTicketsUseCase } from '@/use-cases/production/textile/factories/make-generate-bundle-tickets-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function generateBundleTicketsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/production/orders/:orderId/bundle-tickets',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.PRODUCTION.ENGINEERING.ACCESS,
        resource: 'bundle-tickets',
      }),
    ],
    schema: {
      tags: ['Production - Textile'],
      summary: 'Generate bundle tickets from size-color quantities',
      params: z.object({
        orderId: z.string().min(1),
      }),
      body: generateBundleTicketsSchema,
      response: {
        200: z.object({
          result: bundleTicketsResponseSchema,
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
      const userId = request.user.sub;
      const { orderId } = request.params;
      const { bundleSize, sizes, colors, quantities } = request.body;

      const getUserByIdUseCase = makeGetUserByIdUseCase();
      const { user } = await getUserByIdUseCase.execute({ userId });
      const userName = user.profile?.name
        ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
        : user.username || user.email;

      const useCase = makeGenerateBundleTicketsUseCase();
      const { result } = await useCase.execute({
        tenantId,
        productionOrderId: orderId,
        bundleSize,
        sizes,
        colors,
        quantities,
      });

      await logAudit(request, {
        message: AUDIT_MESSAGES.PRODUCTION.TEXTILE_BUNDLE_TICKETS_GENERATE,
        entityId: orderId,
        placeholders: {
          userName,
          orderNumber: result.orderNumber,
          totalBundles: String(result.totalBundles),
        },
        newData: {
          bundleSize: result.bundleSize,
          totalBundles: result.totalBundles,
          totalPieces: result.totalPieces,
          sizes,
          colors,
        },
      });

      return reply.status(200).send({ result });
    },
  });
}
