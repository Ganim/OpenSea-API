import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  assignTerminalZoneBodySchema,
  assignTerminalZoneParamsSchema,
  assignTerminalZoneResponseSchema,
} from '@/http/schemas/sales/pos/assign-terminal-zone.schema';
import { posTerminalZoneToDTO } from '@/mappers/sales/pos-terminal-zone/pos-terminal-zone-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeAssignTerminalZoneUseCase } from '@/use-cases/sales/pos-terminals/factories/make-assign-terminal-zone-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Assigns a Zone to a POS Terminal with a `tier` (PRIMARY | SECONDARY).
 *
 * Idempotent on `(terminalId, zoneId)`: when the link already exists, the
 * `tier` is updated in place rather than creating a duplicate (the
 * `pos_terminal_zones_unique` constraint forbids duplicates anyway).
 *
 * Returns 404 when the terminal or the zone does not exist within the
 * tenant. Protected by `sales.pos.admin` permission and audited
 * (POS_TERMINAL_ZONE_ASSIGN).
 */
export async function v1AssignTerminalZoneController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
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
      summary: 'Assign or re-tier a Zone to a POS Terminal',
      description:
        'Creates or updates the link between a Zone and a POS Terminal with a tier (PRIMARY or SECONDARY). Idempotent on (terminalId, zoneId). Requires sales.pos.admin permission.',
      params: assignTerminalZoneParamsSchema,
      body: assignTerminalZoneBodySchema,
      response: {
        200: assignTerminalZoneResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { terminalId, zoneId } = request.params;
      const { tier } = request.body;
      const tenantId = request.user.tenantId!;
      const assignedByUserId = request.user.sub;

      try {
        const assignTerminalZoneUseCase = makeAssignTerminalZoneUseCase();
        const { terminalZone } = await assignTerminalZoneUseCase.execute({
          tenantId,
          terminalId,
          zoneId,
          tier,
          assignedByUserId,
        });

        try {
          const getUserByIdUseCase = makeGetUserByIdUseCase();
          const { user: admin } = await getUserByIdUseCase.execute({
            userId: assignedByUserId,
          });
          const adminName = admin.profile?.name
            ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
            : admin.username || admin.email;

          await logAudit(request, {
            message: AUDIT_MESSAGES.SALES.POS_TERMINAL_ZONE_ASSIGN,
            entityId: terminalZone.id.toString(),
            placeholders: {
              userName: adminName,
              zoneId,
              terminalName: terminalId,
              tier,
            },
            newData: {
              terminalId,
              zoneId,
              tier,
            },
          });
        } catch {
          // Audit logging is fire-and-forget at the controller level — never
          // block the success response on audit persistence.
        }

        return reply.status(200).send({
          terminalZone: posTerminalZoneToDTO(terminalZone),
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
