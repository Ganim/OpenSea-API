import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  revokeOperatorParamsSchema,
  revokeOperatorResponseSchema,
} from '@/http/schemas/sales/pos/revoke-operator.schema';
import { posTerminalOperatorToDTO } from '@/mappers/sales/pos-terminal-operator/pos-terminal-operator-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeRevokeOperatorUseCase } from '@/use-cases/sales/pos-terminals/factories/make-revoke-operator-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Revokes an Employee's authorization as operator of a POS Terminal.
 *
 * Soft-deletes the link between the terminal and the employee by flipping
 * `isActive` to false and stamping the `revokedAt` / `revokedByUserId` audit
 * columns. The row is kept so `AssignOperatorUseCase` can reactivate it.
 *
 * Protected by `sales.pos.admin` permission and audited. Returns 404 when
 * the link does not exist and 400 when it has already been revoked.
 */
export async function v1RevokeOperatorController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/pos/terminals/:terminalId/operators/:employeeId',
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
      summary: 'Revoke employee as operator of POS terminal',
      description:
        'Revokes a previously assigned Employee link with a POS Terminal. Soft-deletes the row (sets `isActive=false`, `revokedAt=now()`, `revokedByUserId`). Requires sales.pos.admin permission.',
      params: revokeOperatorParamsSchema,
      response: {
        200: revokeOperatorResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { terminalId, employeeId } = request.params;
      const tenantId = request.user.tenantId!;
      const revokedByUserId = request.user.sub;

      try {
        const revokeOperatorUseCase = makeRevokeOperatorUseCase();
        const { operator } = await revokeOperatorUseCase.execute({
          tenantId,
          terminalId,
          employeeId,
          revokedByUserId,
        });

        try {
          const getUserByIdUseCase = makeGetUserByIdUseCase();
          const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
          const [{ user: admin }, { employee }] = await Promise.all([
            getUserByIdUseCase.execute({ userId: revokedByUserId }),
            getEmployeeByIdUseCase.execute({ tenantId, employeeId }),
          ]);
          const adminName = admin.profile?.name
            ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
            : admin.username || admin.email;

          await logAudit(request, {
            message: AUDIT_MESSAGES.SALES.POS_OPERATOR_REVOKE,
            entityId: operator.id.toString(),
            placeholders: {
              userName: adminName,
              employeeName: employee.fullName,
              terminalName: terminalId,
            },
            oldData: {
              terminalId,
              employeeId,
              isActive: true,
            },
            newData: {
              terminalId,
              employeeId,
              revokedByUserId,
              isActive: false,
            },
          });
        } catch {
          // Audit logging is fire-and-forget at the controller level — never
          // block the success response on audit persistence.
        }

        return reply.status(200).send({
          operator: posTerminalOperatorToDTO(operator),
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
