import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { makeCreatePosTerminalUseCase } from '@/use-cases/sales/pos-terminals/factories/make-create-pos-terminal-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const createTerminalBodySchema = z.object({
  name: z.string().min(1).max(100),
  mode: z.enum(['FAST_CHECKOUT', 'CONSULTIVE', 'SELF_SERVICE', 'EXTERNAL']),
  deviceId: z.string().min(1).max(200),
  warehouseId: z.string().uuid(),
  cashierMode: z.enum(['INTEGRATED', 'SEPARATED']).optional(),
  acceptsPendingOrders: z.boolean().optional(),
  defaultPriceTableId: z.string().uuid().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
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

export async function createTerminalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/terminals',
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
      summary: 'Create a new POS terminal',
      body: createTerminalBodySchema,
      response: {
        201: z.object({ terminal: terminalResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const body = request.body;

      try {
        const createPosTerminalUseCase = makeCreatePosTerminalUseCase();
        const { terminal } = await createPosTerminalUseCase.execute({
          tenantId,
          name: body.name,
          deviceId: body.deviceId,
          mode: body.mode,
          cashierMode: body.cashierMode,
          acceptsPendingOrders: body.acceptsPendingOrders,
          warehouseId: body.warehouseId,
          defaultPriceTableId: body.defaultPriceTableId,
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
          message: AUDIT_MESSAGES.SALES.POS_TERMINAL_CREATE,
          entityId: terminalResponse.id,
          placeholders: {
            userName: userId,
            terminalName: terminal.name,
          },
          newData: {
            name: body.name,
            mode: body.mode,
            warehouseId: body.warehouseId,
          },
        });

        return reply
          .status(201)
          .send({ terminal: terminalResponse } as unknown);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
