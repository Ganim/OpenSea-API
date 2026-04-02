import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeRequestToDTO } from '@/mappers/hr/employee-request';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeListPendingApprovalsUseCase } from '@/use-cases/hr/employee-requests/factories/make-list-pending-approvals-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListPendingApprovalsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/requests/pending-approvals',
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
      summary: 'List pending approvals',
      description:
        'Returns pending requests for the manager/approver to review',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          employeeRequests: z.array(
            z.object({
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
          ),
          meta: z.object({
            total: z.number(),
            page: z.number(),
            limit: z.number(),
            pages: z.number(),
          }),
        }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { page, limit } = request.query;

      const employeesRepository = new PrismaEmployeesRepository();
      const employee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!employee) {
        return reply.status(200).send({
          employeeRequests: [],
          meta: { total: 0, page, limit, pages: 0 },
        });
      }

      const listPendingApprovalsUseCase = makeListPendingApprovalsUseCase();
      const { employeeRequests, total } =
        await listPendingApprovalsUseCase.execute({
          tenantId,
          approverEmployeeId: employee.id.toString(),
          page,
          limit,
        });

      return reply.status(200).send({
        employeeRequests: employeeRequests.map(employeeRequestToDTO),
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      });
    },
  });
}
