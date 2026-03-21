import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const updateTerminalBodySchema = z.object({
  name: z.string().min(1).max(100).optional(),
  mode: z.enum(['RETAIL', 'FOOD_SERVICE', 'QUICK_SERVICE']).optional(),
  warehouseId: z.string().uuid().optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

const terminalResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mode: z.string(),
  warehouseId: z.string().uuid(),
  description: z.string().nullable(),
  isActive: z.boolean(),
  tenantId: z.string().uuid(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

      // TODO: Replace stub with real use case
      const terminal = {
        id: terminalId,
        name: body.name ?? 'Terminal',
        mode: body.mode ?? 'RETAIL',
        warehouseId: body.warehouseId ?? crypto.randomUUID(),
        description: body.description ?? null,
        isActive: body.isActive ?? true,
        tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await logAudit(request, {
        message: 'POS terminal updated: {terminalName}',
        entityId: terminalId,
        placeholders: { userName: userId, terminalName: terminal.name },
        newData: body,
      });

      return reply.status(200).send({ terminal });
    },
  });
}
