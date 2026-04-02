import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeListPosTerminalsUseCase } from '@/use-cases/sales/pos-terminals/factories/make-list-pos-terminals-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const listTerminalsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  mode: z.string().optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

const terminalResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mode: z.string(),
  deviceId: z.string(),
  warehouseId: z.string().uuid(),
  cashierMode: z.string(),
  acceptsPendingOrders: z.boolean(),
  isActive: z.boolean(),
  tenantId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string().nullable(),
});

export async function listTerminalsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/pos/terminals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ACCESS,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'List POS terminals',
      querystring: listTerminalsQuerySchema,
      response: {
        200: z.object({
          terminals: z.array(terminalResponseSchema),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { page, limit, search, mode, isActive } = request.query;

      const listPosTerminalsUseCase = makeListPosTerminalsUseCase();
      const { terminals, total, totalPages } =
        await listPosTerminalsUseCase.execute({
          tenantId,
          page,
          limit,
          search,
          mode,
          isActive: isActive !== undefined ? isActive === 'true' : undefined,
        });

      const terminalResponses = terminals.map((terminal) => ({
        id: terminal.id.toString(),
        name: terminal.name,
        mode: terminal.mode,
        deviceId: terminal.deviceId,
        warehouseId: terminal.warehouseId.toString(),
        cashierMode: terminal.cashierMode,
        acceptsPendingOrders: terminal.acceptsPendingOrders,
        isActive: terminal.isActive,
        tenantId: terminal.tenantId.toString(),
        createdAt: terminal.createdAt.toISOString(),
        updatedAt: terminal.updatedAt?.toISOString() ?? null,
      }));

      return reply.status(200).send({
        terminals: terminalResponses,
        meta: { total, page, limit, pages: totalPages },
      } as unknown);
    },
  });
}
