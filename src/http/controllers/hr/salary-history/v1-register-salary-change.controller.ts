import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  registerSalaryChangeBodySchema,
  registerSalaryChangeResponseSchema,
  salaryHistoryParamsSchema,
} from '@/http/schemas/hr/salary-history';
import { salaryHistoryToDTO } from '@/mappers/hr/salary-history';
import { makeVerifyActionPinUseCase } from '@/use-cases/core/auth/factories/make-verify-action-pin-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import { makeRegisterSalaryChangeUseCase } from '@/use-cases/hr/salary-history/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RegisterSalaryChangeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/employees/:id/salary-history',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.SALARY.MODIFY,
        resource: 'salary-history',
      }),
    ],
    schema: {
      tags: ['HR - Salary History'],
      summary: 'Registra uma alteração salarial',
      description:
        'Cria um registro de mudança salarial. Quando a data de vigência é hoje ou anterior, o salário base do funcionário também é atualizado. Requer PIN de ação do solicitante.',
      params: salaryHistoryParamsSchema,
      body: registerSalaryChangeBodySchema,
      response: {
        201: registerSalaryChangeResponseSchema,
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { newSalary, reason, notes, effectiveDate, pin } = request.body;
      const actorUserId = request.user.sub;
      const tenantId = request.user.tenantId!;

      try {
        const verifyActionPinUseCase = makeVerifyActionPinUseCase();
        const { valid: pinIsValid } = await verifyActionPinUseCase.execute({
          userId: actorUserId,
          actionPin: pin,
        });

        if (!pinIsValid) {
          return reply.status(401).send({ message: 'PIN de ação inválido.' });
        }

        const registerSalaryChangeUseCase = makeRegisterSalaryChangeUseCase();
        const { salaryHistory, appliedToEmployee, previousSalary } =
          await registerSalaryChangeUseCase.execute({
            tenantId,
            employeeId: id,
            newSalary,
            reason,
            notes,
            effectiveDate,
            changedBy: actorUserId,
          });

        const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();
        const { employee } = await getEmployeeByIdUseCase.execute({
          tenantId,
          employeeId: id,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.SALARY_CHANGE_REGISTER,
          entityId: salaryHistory.id.toString(),
          placeholders: {
            userName: actorUserId,
            employeeName: employee.fullName,
            previousSalary:
              previousSalary !== null
                ? previousSalary.toFixed(2)
                : 'sem valor anterior',
            newSalary: newSalary.toFixed(2),
            reason,
          },
          newData: {
            previousSalary,
            newSalary,
            reason,
            effectiveDate: effectiveDate.toISOString(),
            appliedToEmployee,
          },
        });

        return reply.status(201).send({
          salaryHistory: salaryHistoryToDTO(salaryHistory),
          appliedToEmployee,
          previousSalary,
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
