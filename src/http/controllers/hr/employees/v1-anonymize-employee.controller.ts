import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { anonymizeEmployeeSchema } from '@/http/schemas';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeVerifyActionPinUseCase } from '@/use-cases/core/auth/factories/make-verify-action-pin-use-case';
import { makeAnonymizeEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-anonymize-employee-use-case';
import { makeGetEmployeeByIdUseCase } from '@/use-cases/hr/employees/factories/make-get-employee-by-id-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AnonymizeEmployeeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/employees/:id/anonymize',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'employees',
      }),
    ],
    schema: {
      tags: ['HR - Employees'],
      summary: 'Anonimiza um funcionário (LGPD Art. 18 VI)',
      description:
        'Substitui todos os dados pessoais (PII) do funcionário por valores anonimizados, ' +
        'preservando apenas dados fiscais (folha, holerites, eventos eSocial e auditoria) ' +
        'pelo prazo legal de retenção (5+ anos). Operação irreversível — exige PIN de ' +
        'ação do solicitante e confirmação textual literal "ANONIMIZAR".',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: anonymizeEmployeeSchema,
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { id } = request.params;
      const { pin, confirmation, reason } = request.body;
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

        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getEmployeeByIdUseCase = makeGetEmployeeByIdUseCase();

        const [{ user: actor }, { employee: employeeBeforeAnonymization }] =
          await Promise.all([
            getUserByIdUseCase.execute({ userId: actorUserId }),
            getEmployeeByIdUseCase.execute({ tenantId, employeeId: id }),
          ]);

        const adminName = actor.profile?.name
          ? `${actor.profile.name} ${actor.profile.surname || ''}`.trim()
          : actor.username || actor.email;

        const anonymizeEmployeeUseCase = makeAnonymizeEmployeeUseCase();
        await anonymizeEmployeeUseCase.execute({
          tenantId,
          employeeId: id,
          actorUserId,
          confirmation,
          reason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_ANONYMIZED,
          entityId: id,
          placeholders: {
            adminName,
            employeeName: employeeBeforeAnonymization.fullName,
          },
          oldData: {
            fullName: employeeBeforeAnonymization.fullName,
            registrationNumber: employeeBeforeAnonymization.registrationNumber,
          },
          newData: {
            anonymizationReason: reason ?? 'LGPD Art. 18 VI',
            actorUserId,
          },
        });

        return reply.status(204).send(null);
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
