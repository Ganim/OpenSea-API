import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeGetConflictUseCase } from '@/use-cases/sales/pos-conflicts/factories/make-get-conflict-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

const POS_ORDER_CONFLICT_STATUS_VALUES = [
  'PENDING_RESOLUTION',
  'AUTO_SUBSTITUTED',
  'AUTO_ADJUSTED',
  'CANCELED_REFUNDED',
  'FORCED_ADJUSTMENT',
  'ITEM_SUBSTITUTED_MANUAL',
  'EXPIRED',
] as const;

const POS_ORDER_CONFLICT_REASON_VALUES = [
  'INSUFFICIENT_STOCK',
  'FRACTIONAL_NOT_ALLOWED',
  'BELOW_MIN_FRACTIONAL_SALE',
  'ITEM_NOT_FOUND',
] as const;

const conflictDetailEnrichedSchema = z.object({
  itemId: z.string(),
  variantId: z.string(),
  variantName: z.string(),
  requestedQuantity: z.number(),
  availableQuantity: z.number(),
  shortage: z.number(),
  reason: z.enum(POS_ORDER_CONFLICT_REASON_VALUES),
});

const conflictOrderSummarySchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: z.string(),
  grandTotal: z.number(),
  currency: z.string(),
  customerId: z.string().nullable(),
});

const conflictDetailResponseSchema = z.object({
  id: z.string(),
  saleLocalUuid: z.string(),
  status: z.enum(POS_ORDER_CONFLICT_STATUS_VALUES),
  posTerminalId: z.string(),
  terminalName: z.string(),
  posSessionId: z.string().nullable(),
  posOperatorEmployeeId: z.string().nullable(),
  operatorName: z.string(),
  operatorShortId: z.string(),
  conflictDetails: z.array(conflictDetailEnrichedSchema),
  resolvedByUserId: z.string().nullable(),
  resolvedByUserName: z.string(),
  resolvedAt: z.string().nullable(),
  orderId: z.string().nullable(),
  order: conflictOrderSummarySchema.nullable(),
  createdAt: z.string(),
});

/**
 * GET /v1/admin/pos/conflicts/:id
 *
 * Returns a single POS Order Conflict enriched with terminal name, operator
 * name + shortId, the resolver user's display name, and per-detail
 * `variantName`. Used by the RP `ConflictDetailsPanel` (Plan B F-01).
 *
 * Protected by `sales.pos.admin`.
 */
export async function v1GetConflictController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/pos/conflicts/:conflictId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ADMIN,
        resource: 'pos-conflicts',
      }),
    ],
    schema: {
      tags: ['POS - Admin'],
      summary: 'Get a single POS order conflict (enriched)',
      params: z.object({ conflictId: z.string().uuid() }),
      response: {
        200: z.object({ conflict: conflictDetailResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { conflictId } = request.params;

      try {
        const useCase = makeGetConflictUseCase();
        const result = await useCase.execute({ tenantId, conflictId });
        return reply.send({ conflict: result.conflict });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
