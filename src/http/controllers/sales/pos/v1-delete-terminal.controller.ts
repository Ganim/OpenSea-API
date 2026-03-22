import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteTerminalController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
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
      summary: 'Delete a POS terminal',
      params: z.object({
        terminalId: z.string().uuid().describe('Terminal UUID'),
      }),
      response: {
        204: z.null(),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { terminalId } = request.params;

      // TODO: Replace stub with real use case (find + delete)

      await logAudit(request, {
        message: AUDIT_MESSAGES.SALES.POS_TERMINAL_DELETE,
        entityId: terminalId,
        placeholders: { userName: userId, terminalId },
        oldData: { id: terminalId, tenantId },
      });

      return reply.status(204).send(null);
    },
  });
}
