import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeRequestToDTO } from '@/mappers/hr/employee-request';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCancelRequestUseCase } from '@/use-cases/hr/employee-requests/factories/make-cancel-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CancelMyRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/my/requests/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEE_REQUESTS.ACCESS,
        resource: 'employee-requests',
      }),
    ],
    schema: {
      tags: ['HR - Employee Portal'],
      summary: 'Cancel my request',
      description: 'Cancels a pending request for the logged-in employee',
      params: z.object({
        id: z.string().uuid(),
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
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { id: requestId } = request.params;

      const employeesRepository = new PrismaEmployeesRepository();
      const employee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!employee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const cancelRequestUseCase = makeCancelRequestUseCase();
        const { employeeRequest } = await cancelRequestUseCase.execute({
          tenantId,
          requestId,
          employeeId: employee.id.toString(),
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_REQUEST_CANCEL,
          entityId: employeeRequest.id.toString(),
          placeholders: { userName: userId },
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
