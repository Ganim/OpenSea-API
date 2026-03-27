import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { employeeKudosToDTO } from '@/mappers/hr/employee-kudos';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeListReceivedKudosUseCase } from '@/use-cases/hr/kudos/factories/make-list-received-kudos-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListReceivedKudosController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/kudos/received',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Kudos'],
      summary: 'List kudos I received',
      description:
        'Returns a paginated list of kudos received by the logged-in employee',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
      }),
      response: {
        200: z.object({
          kudos: z.array(
            z.object({
              id: z.string(),
              fromEmployeeId: z.string(),
              toEmployeeId: z.string(),
              message: z.string(),
              category: z.string(),
              isPublic: z.boolean(),
              createdAt: z.date(),
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
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      const listReceivedKudosUseCase = makeListReceivedKudosUseCase();
      const { kudos, total } = await listReceivedKudosUseCase.execute({
        tenantId,
        employeeId: employee.id.toString(),
        page,
        limit,
      });

      return reply.status(200).send({
        kudos: kudos.map(employeeKudosToDTO),
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
