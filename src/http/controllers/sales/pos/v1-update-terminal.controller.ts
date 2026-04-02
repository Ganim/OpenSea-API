import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeUpdatePosTerminalUseCase } from '@/use-cases/sales/pos-terminals/factories/make-update-pos-terminal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const updateTerminalBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  deviceId: z.string().min(1).max(200).optional(),
  mode: z
    .enum(['FAST_CHECKOUT', 'CONSULTIVE', 'SELF_SERVICE', 'EXTERNAL'])
    .optional(),
  cashierMode: z.enum(['INTEGRATED', 'SEPARATED']).optional(),
  acceptsPendingOrders: z.boolean().optional(),
  warehouseId: z.string().uuid().optional(),
  defaultPriceTableId: z.string().uuid().nullable().optional(),
  isActive: z.boolean().optional(),
  settings: z.record(z.string(), z.unknown()).nullable().optional(),
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

export async function updateTerminalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/pos/terminals/:terminalId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.SALES.POS.ADMIN,
        resource: 'pos-terminals',
      }),
    ],
    schema: {
      tags: ['Sales - POS'],
      summary: 'Update a POS terminal',
      params: z.object({
        terminalId: z.string().uuid().describe('Terminal UUID'),
      }),
      body: updateTerminalBodySchema,
      response: {
        200: z.object({ terminal: terminalResponseSchema }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { terminalId } = request.params;
      const body = request.body;

      try {
        const updatePosTerminalUseCase = makeUpdatePosTerminalUseCase();
        const { terminal } = await updatePosTerminalUseCase.execute({
          tenantId,
          terminalId,
          name: body.name,
          deviceId: body.deviceId,
          mode: body.mode,
          cashierMode: body.cashierMode,
          acceptsPendingOrders: body.acceptsPendingOrders,
          warehouseId: body.warehouseId,
          defaultPriceTableId: body.defaultPriceTableId,
          isActive: body.isActive,
          settings: body.settings,
        });

        const terminalResponse = {
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
        };

        await logAudit(request, {
          message: AUDIT_MESSAGES.SALES.POS_TERMINAL_UPDATE,
          entityId: terminalId,
          placeholders: { userName: userId, terminalName: terminal.name },
          newData: body,
        });

        return reply
          .status(200)
          .send({ terminal: terminalResponse } as unknown);
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
