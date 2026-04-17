import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeRequestToDTO } from '@/mappers/hr/employee-request';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCreateRequestUseCase } from '@/use-cases/hr/employee-requests/factories/make-create-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateMyRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/my/requests',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEE_REQUESTS.REGISTER,
        resource: 'employee-requests',
      }),
    ],
    schema: {
      tags: ['HR - Employee Portal'],
      summary: 'Create a new employee request',
      description:
        'Creates a new request (vacation, absence, advance, data change, support) for the logged-in employee',
      body: z.object({
        type: z.enum([
          'VACATION',
          'ABSENCE',
          'ADVANCE',
          'DATA_CHANGE',
          'SUPPORT',
        ]),
        data: z.record(z.unknown()).default({}),
      }),
      response: {
        201: z.object({
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
        const createRequestUseCase = makeCreateRequestUseCase();
        const { employeeRequest } = await createRequestUseCase.execute({
          tenantId,
          employeeId: employee.id.toString(),
          type: request.body.type,
          data: request.body.data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.EMPLOYEE_REQUEST_CREATE,
          entityId: employeeRequest.id.toString(),
          placeholders: {
            userName: userId,
            requestType: request.body.type,
          },
          newData: { type: request.body.type, data: request.body.data },
        });

        return reply.status(201).send({
          employeeRequest: employeeRequestToDTO(employeeRequest),
        });
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
