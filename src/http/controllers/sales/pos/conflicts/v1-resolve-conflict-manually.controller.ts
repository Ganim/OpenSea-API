import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  resolveConflictManuallyBodySchema,
  resolveConflictManuallyParamsSchema,
  resolveConflictManuallyResponseSchema,
} from '@/http/schemas/sales/pos/resolve-conflict-manually.schema';
import { makeResolveConflictManuallyUseCase } from '@/use-cases/sales/pos-conflicts/factories/make-resolve-conflict-manually-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * `POST /v1/admin/pos/conflicts/:id/resolve` (Emporion Plan A — Task 31).
 *
 * Manually resolves a POS Order Conflict via one of three actions:
 *  - `CANCEL_AND_REFUND` — cancel the sale, no stock movement
 *  - `FORCE_ADJUSTMENT` — admin asserts the physical stock is correct,
 *    triggers an `INVENTORY_ADJUSTMENT` movement and re-creates the Order
 *  - `SUBSTITUTE_ITEM` — admin picks substitute items for the conflicting
 *    cart lines and re-creates the Order with them
 *
 * Gated by `sales.pos.conflicts-resolve` (the dedicated permission for this
 * sensitive operation, separate from the broader `sales.pos.admin` used by
 * the listing endpoint).
 */
export async function v1ResolveConflictManuallyController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/pos/conflicts/:id/resolve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.CONFLICTS_RESOLVE,
        resource: 'pos-conflicts',
      }),
    ],
    schema: {
      tags: ['POS - Admin'],
      summary: 'Resolve a POS order conflict manually',
      description:
        'Resolves a POS Order Conflict via one of three operator-driven actions: CANCEL_AND_REFUND (cancel the sale and refund the customer), FORCE_ADJUSTMENT (acknowledge that the physical stock matches the cart and force inventory adjustments before re-creating the Order) or SUBSTITUTE_ITEM (manually pick substitute items for the conflicting lines and re-create the Order). Returns the updated conflict and the resulting Order. The conflict must be in `PENDING_RESOLUTION` status. Requires `sales.pos.conflicts-resolve` permission.',
      params: resolveConflictManuallyParamsSchema,
      body: resolveConflictManuallyBodySchema,
      response: {
        200: resolveConflictManuallyResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id: conflictId } = request.params;
      const body = request.body;
      const tenantId = request.user.tenantId!;
      const resolvedByUserId = request.user.sub;

      const resolveConflictManuallyUseCase =
        makeResolveConflictManuallyUseCase();
      const result = await resolveConflictManuallyUseCase.execute({
        tenantId,
        conflictId,
        resolvedByUserId,
        action: body.action,
        notes: body.notes,
        substituteItemIds: body.substituteItemIds,
      });

      return reply.status(200).send(result);
    },
  });
}
