import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeRequestToDTO } from '@/mappers/hr/employee-request';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeListMyRequestsUseCase } from '@/use-cases/hr/employee-requests/factories/make-list-my-requests-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListMyRequestsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/my/requests',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Employee Portal'],
      summary: 'List my requests',
      description:
        'Returns a paginated list of the logged-in employee requests',
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

      const listMyRequestsUseCase = makeListMyRequestsUseCase();
      const { employeeRequests, total } = await listMyRequestsUseCase.execute({
        tenantId,
        employeeId: employee.id.toString(),
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
