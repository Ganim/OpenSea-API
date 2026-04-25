import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listTerminalOperatorsParamsSchema,
  listTerminalOperatorsQuerySchema,
  listTerminalOperatorsResponseSchema,
} from '@/http/schemas/sales/pos/list-terminal-operators.schema';
import { makeListTerminalOperatorsUseCase } from '@/use-cases/sales/pos-terminals/factories/make-list-terminal-operators-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Lists the Employees linked as operators of a specific POS Terminal.
 *
 * Defaults to showing only currently-active links (`isActive=true`). Pass
 * `isActive=all` to include revoked rows for audit / history views. Rows are
 * ordered by `assignedAt DESC` and enriched with the Employee's `fullName`
 * and `shortId` in a single bulk lookup.
 *
 * Protected by `sales.pos.admin` permission.
 */
export async function v1ListTerminalOperatorsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals/:terminalId/operators',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ADMIN,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['POS - Terminals'],
      summary: 'List operators of POS terminal',
      description:
        'Lists the Employees linked as operators of a specific POS Terminal. Defaults to active-only; pass `isActive=all` to include revoked rows. Ordered by `assignedAt DESC`. Requires sales.pos.admin permission.',
      params: listTerminalOperatorsParamsSchema,
      querystring: listTerminalOperatorsQuerySchema,
      response: {
        200: listTerminalOperatorsResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { terminalId } = request.params;
      const { page, limit, isActive } = request.query;
      const tenantId = request.user.tenantId!;

      try {
        const listTerminalOperatorsUseCase = makeListTerminalOperatorsUseCase();
        const { data, meta } = await listTerminalOperatorsUseCase.execute({
          tenantId,
          terminalId,
          page,
          limit,
          isActive: isActive === 'all' ? 'all' : 'active',
        });

        return reply.status(200).send({
          data: data.map((row) => ({
            operatorId: row.operatorId,
            employeeId: row.employeeId,
            employeeName: row.employeeName,
            employeeShortId: row.employeeShortId,
            assignedAt: row.assignedAt.toISOString(),
            assignedByUserId: row.assignedByUserId,
            isActive: row.isActive,
            revokedAt: row.revokedAt ? row.revokedAt.toISOString() : null,
          })),
          meta,
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
