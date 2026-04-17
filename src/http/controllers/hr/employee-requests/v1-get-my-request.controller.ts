import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeRequestToDTO } from '@/mappers/hr/employee-request';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeGetRequestUseCase } from '@/use-cases/hr/employee-requests/factories/make-get-request-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetMyRequestController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
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
      summary: 'Get my request detail',
      description: 'Returns a specific request for the logged-in employee',
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
        const getRequestUseCase = makeGetRequestUseCase();
        const { employeeRequest } = await getRequestUseCase.execute({
          tenantId,
          requestId,
          employeeId: employee.id.toString(),
        });

        return reply.status(200).send({
          employeeRequest: employeeRequestToDTO(employeeRequest),
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
