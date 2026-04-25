import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  unassignTerminalZoneParamsSchema,
  unassignTerminalZoneResponseSchema,
} from '@/http/schemas/sales/pos/unassign-terminal-zone.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUnassignTerminalZoneUseCase } from '@/use-cases/sales/pos-terminals/factories/make-unassign-terminal-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Removes the link between a POS Terminal and a Zone.
 *
 * Hard-deletes the join row (the underlying Zone and PosTerminal are kept
 * intact). Returns 404 when no link exists for `(terminalId, zoneId)` within
 * the tenant. Protected by `sales.pos.admin` permission and audited
 * (POS_TERMINAL_ZONE_UNASSIGN).
 */
export async function v1UnassignTerminalZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/pos/terminals/:terminalId/zones/:zoneId',
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
      summary: 'Remove the link between a POS Terminal and a Zone',
      description:
        'Hard-deletes the join row in `pos_terminal_zones` for `(terminalId, zoneId)` within the tenant. Requires sales.pos.admin permission.',
      params: unassignTerminalZoneParamsSchema,
      response: {
        200: unassignTerminalZoneResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { terminalId, zoneId } = request.params;
      const tenantId = request.user.tenantId!;
      const unassignedByUserId = request.user.sub;

      try {
        const unassignTerminalZoneUseCase = makeUnassignTerminalZoneUseCase();
        await unassignTerminalZoneUseCase.execute({
          tenantId,
          terminalId,
          zoneId,
          unassignedByUserId,
        });

        try {
          const getUserByIdUseCase = makeGetUserByIdUseCase();
          const { user: admin } = await getUserByIdUseCase.execute({
            userId: unassignedByUserId,
          });
          const adminName = admin.profile?.name
            ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
            : admin.username || admin.email;

          await logAudit(request, {
            message: AUDIT_MESSAGES.SALES.POS_TERMINAL_ZONE_UNASSIGN,
            entityId: `${terminalId}:${zoneId}`,
            placeholders: {
              userName: adminName,
              zoneId,
              terminalName: terminalId,
            },
            oldData: {
              terminalId,
              zoneId,
            },
          });
        } catch {
          // Audit logging is fire-and-forget at the controller level — never
          // block the success response on audit persistence.
        }

        return reply.status(200).send({ success: true });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
