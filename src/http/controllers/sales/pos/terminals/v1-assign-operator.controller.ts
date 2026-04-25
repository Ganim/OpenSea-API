import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  assignOperatorBodySchema,
  assignOperatorParamsSchema,
  assignOperatorResponseSchema,
} from '@/http/schemas/sales/pos/assign-operator.schema';
import { posTerminalOperatorToDTO } from '@/mappers/sales/pos-terminal-operator/pos-terminal-operator-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeAssignOperatorUseCase } from '@/use-cases/sales/pos-terminals/factories/make-assign-operator-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

/**
 * Assigns an Employee as an authorized operator of a POS Terminal.
 *
 * Used by Emporion POS admin flow to control which employees can sign in
 * as operators on each terminal. Protected by `sales.pos.admin` permission
 * and audited. Reactivates revoked links instead of failing on the
 * (terminal_id, employee_id) UNIQUE constraint.
 */
export async function v1AssignOperatorController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/pos/terminals/:terminalId/operators',
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
      summary: 'Assign employee as operator of POS terminal',
      description:
        'Links an Employee as an authorized operator of a POS Terminal. Reactivates a previously revoked link if one exists. Requires sales.pos.admin permission.',
      params: assignOperatorParamsSchema,
      body: assignOperatorBodySchema,
      response: {
        200: assignOperatorResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { terminalId } = request.params;
      const { employeeId } = request.body;
      const tenantId = request.user.tenantId!;
      const assignedByUserId = request.user.sub;

      try {
        const assignOperatorUseCase = makeAssignOperatorUseCase();
        const { operator } = await assignOperatorUseCase.execute({
          tenantId,
          terminalId,
          employeeId,
          assignedByUserId,
        });

        try {
          const getUserByIdUseCase = makeGetUserByIdUseCase();
          const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
          const [{ user: admin }, { employee }] = await Promise.all([
            getUserByIdUseCase.execute({ userId: assignedByUserId }),
            getEmployeeByIdUseCase.execute({ tenantId, employeeId }),
          ]);
          const adminName = admin.profile?.name
            ? `${admin.profile.name} ${admin.profile.surname || ''}`.trim()
            : admin.username || admin.email;

          await logAudit(request, {
            message: AUDIT_MESSAGES.SALES.POS_OPERATOR_ASSIGN,
            entityId: operator.id.toString(),
            placeholders: {
              userName: adminName,
              employeeName: employee.fullName,
              terminalName: terminalId,
            },
            newData: {
              terminalId,
              employeeId,
              assignedByUserId,
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
