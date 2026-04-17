import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { actionPinSchema } from '@/http/schemas/core/auth/pin.schema';
import { employeeRequestToDTO } from '@/mappers/hr/employee-request';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeVerifyActionPinUseCase } from '@/use-cases/core/auth/factories/make-verify-action-pin-use-case';
import { makeApproveRequestUseCase } from '@/use-cases/hr/employee-requests/factories/make-approve-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ApproveRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/requests/:id/approve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEE_REQUESTS.ADMIN,
        resource: 'employee-requests',
      }),
    ],
    schema: {
      tags: ['HR - Employee Portal'],
      summary: 'Approve a request',
      description:
        'Approves a pending employee request. Requires the caller to confirm their action PIN — the HR CLAUDE.md mandates PIN for approve/reject on vacation requests and the same protection is applied to every request type for consistency.',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: z.object({
        pin: actionPinSchema,
      }),
      response: {
        200: z.object({
          employeeRequest: z.object({
            id: z.string(),
            employeeId: z.string(),
            type: z.string(),
            status: z.string(),
            data: z.record(z.unknown()),
            approverEmployeeId: z.string().nullable(),
            approvedAt: z.date().nullable(),
            rejectionReason: z.string().nullable(),
            createdAt: z.date(),
            updatedAt: z.date(),
          }),
        }),
        400: z.object({ message: z.string() }),
        401: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: requestId } = request.params;
      const { pin } = request.body;

      // Confirm the approver's action PIN before committing the approval.
      // Without this, any user with `hr.employee-requests.admin` could approve
      // requests silently — the HR CLAUDE.md explicitly requires PIN on
      // approve/reject vacation requests (extended here to all request types
      // for consistency).
      const verifyActionPinUseCase = makeVerifyActionPinUseCase();
      const { valid: pinIsValid } = await verifyActionPinUseCase.execute({
        userId,
        actionPin: pin,
      });

      if (!pinIsValid) {
        return reply.status(401).send({ message: 'PIN de ação inválido.' });
      }

      const employeesRepository = new PrismaEmployeesRepository();
      const approverEmployee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!approverEmployee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const approveRequestUseCase = makeApproveRequestUseCase();
        const { employeeRequest } = await approveRequestUseCase.execute({
          tenantId,
          requestId,
          approverEmployeeId: approverEmployee.id.toString(),
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_REQUEST_APPROVE,
          entityId: employeeRequest.id.toString(),
          placeholders: {
            userName: userId,
            employeeName: employeeRequest.employeeId.toString(),
          },
        });

        return reply.status(200).send({
          employeeRequest: employeeRequestToDTO(employeeRequest),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
