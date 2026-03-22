import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

const createTerminalBodySchema = z.object({
  name: z.string().min(1).max(100),
  mode: z.enum(['RETAIL', 'FOOD_SERVICE', 'QUICK_SERVICE']),
  warehouseId: z.string().uuid(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
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

      // TODO: Replace stub with real use case
      const terminal = {
        id: crypto.randomUUID(),
        name: body.name,
        mode: body.mode,
        warehouseId: body.warehouseId,
        description: body.description ?? null,
        isActive: body.isActive ?? true,
        tenantId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.POS_TERMINAL_CREATE,
        entityId: terminal.id,
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

      return reply.status(201).send({ terminal });
    },
  });
}
