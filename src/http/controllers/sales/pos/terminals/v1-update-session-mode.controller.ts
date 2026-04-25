import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  updateSessionModeBodySchema,
  updateSessionModeParamsSchema,
  updateSessionModeResponseSchema,
} from '@/http/schemas/sales/pos/update-session-mode.schema';
import { posTerminalToDTO } from '@/mappers/sales/pos-terminal/pos-terminal-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeUpdateSessionModeUseCase } from '@/use-cases/sales/pos-terminals/factories/make-update-session-mode-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Updates the operator-session and coordination configuration of a POS Terminal.
 *
 * Body fields:
 *  - `operatorSessionMode`: `PER_SALE` | `STAY_LOGGED_IN` (required).
 *  - `operatorSessionTimeout`: positive integer in seconds — required when
 *    `operatorSessionMode === 'STAY_LOGGED_IN'`. Forced to `null` when
 *    `PER_SALE`.
 *  - `autoCloseSessionAt`: optional `HH:MM` (24h) wall-clock time at which
 *    the session is force-closed daily. Pass `null` to clear it.
 *  - `coordinationMode`: optional `STANDALONE | SELLER | CASHIER | BOTH`.
 *
 * Domain invariants are enforced inside `PosTerminal.updateSessionConfig(...)`
 * and surfaced as 400 by the use case. Protected by `sales.pos.admin`
 * permission and audited (POS_TERMINAL_SESSION_MODE_UPDATE).
 */
export async function v1UpdateSessionModeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/pos/terminals/:terminalId/config',
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
      summary: 'Update POS terminal session and coordination configuration',
      description:
        'Updates `operatorSessionMode`, `operatorSessionTimeout`, `autoCloseSessionAt` and `coordinationMode` of a POS Terminal in a single transactional call. Requires sales.pos.admin permission.',
      params: updateSessionModeParamsSchema,
      body: updateSessionModeBodySchema,
      response: {
        200: updateSessionModeResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { terminalId } = request.params;
      const tenantId = request.user.tenantId!;
      const updatedByUserId = request.user.sub;
      const {
        operatorSessionMode,
        operatorSessionTimeout,
        autoCloseSessionAt,
        coordinationMode,
      } = request.body;

      try {
        const updateSessionModeUseCase = makeUpdateSessionModeUseCase();
        const { terminal } = await updateSessionModeUseCase.execute({
          tenantId,
          terminalId,
          operatorSessionMode,
          operatorSessionTimeout: operatorSessionTimeout ?? undefined,
          autoCloseSessionAt: autoCloseSessionAt ?? undefined,
          coordinationMode,
          updatedByUserId,
        });

        try {
          const getUserByIdUseCase = makeGetUserByIdUseCase();
          const { user: admin } = await getUserByIdUseCase.execute({
            userId: updatedByUserId,
          });
          const adminName = admin.profile?.name
            ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
            : admin.username || admin.email;

          await logAudit(request, {
            message: AUDIT_MESSAGES.SALES.POS_TERMINAL_SESSION_MODE_UPDATE,
            entityId: terminal.id.toString(),
            placeholders: {
              userName: adminName,
              terminalName: terminal.terminalName,
            },
            newData: {
              operatorSessionMode: terminal.operatorSessionMode.value,
              operatorSessionTimeout: terminal.operatorSessionTimeout ?? null,
              autoCloseSessionAt: terminal.autoCloseSessionAt ?? null,
              coordinationMode: terminal.coordinationMode.value,
            },
          });
        } catch {
          // Audit logging is fire-and-forget at the controller level — never
          // block the success response on audit persistence.
        }

        return reply.status(200).send({
          terminal: posTerminalToDTO(terminal),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
