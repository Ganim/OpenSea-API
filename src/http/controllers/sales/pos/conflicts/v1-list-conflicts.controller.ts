import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listConflictsQuerySchema,
  listConflictsResponseSchema,
} from '@/http/schemas/sales/pos/list-conflicts.schema';
import { makeListConflictsUseCase } from '@/use-cases/sales/pos-conflicts/factories/make-list-conflicts-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import type { PosOrderConflictStatusValue } from '@/entities/sales/value-objects/pos-order-conflict-status';

/**
 * GET /v1/admin/pos/conflicts
 *
 * Lists POS Order Conflicts for the admin operations panel
 * (Emporion Plan A — Task 30). Supports filtering by `status[]`,
 * `terminalId`, `operatorEmployeeId`, plus standard pagination.
 *
 * Each row is enriched with the terminal's `terminalName` and the operator's
 * `fullName` + `shortId` via two bulk lookups (no N+1).
 *
 * Protected by `sales.pos.admin` permission.
 */
export async function v1ListConflictsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/admin/pos/conflicts',
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
      summary: 'List POS order conflicts',
      description:
        'Lists POS Order Conflicts (pending and resolved) for the admin operations panel. Supports filtering by `status[]`, `terminalId`, `operatorEmployeeId`. Rows are ordered by `createdAt DESC` and enriched with the terminal name and operator name/short id. Requires `sales.pos.admin` permission.',
      querystring: listConflictsQuerySchema,
      response: {
        200: listConflictsResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { status, terminalId, operatorEmployeeId, page, limit } =
        request.query;
      const tenantId = request.user.tenantId!;

      // Normalize status into a string[] (Fastify may give us a single value
      // or already an array depending on the wire format).
      const normalizedStatuses: PosOrderConflictStatusValue[] | undefined =
        status === undefined
          ? undefined
          : Array.isArray(status)
            ? status
            : [status];

      const listConflictsUseCase = makeListConflictsUseCase();
      const { data, meta } = await listConflictsUseCase.execute({
        tenantId,
        page,
        limit,
        status: normalizedStatuses,
        terminalId,
        operatorEmployeeId,
      });

      return reply.status(200).send({
        data: data.map((row) => ({
          id: row.id,
          saleLocalUuid: row.saleLocalUuid,
          status: row.status,
          posTerminalId: row.posTerminalId,
          terminalName: row.terminalName,
          posSessionId: row.posSessionId,
          posOperatorEmployeeId: row.posOperatorEmployeeId,
          operatorName: row.operatorName,
          operatorShortId: row.operatorShortId,
          conflictDetails: row.conflictDetails,
          resolvedByUserId: row.resolvedByUserId,
          resolvedAt: row.resolvedAt ? row.resolvedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        })),
        meta,
      });
    },
  });
}
