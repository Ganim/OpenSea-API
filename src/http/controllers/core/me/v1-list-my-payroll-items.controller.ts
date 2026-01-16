import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { payrollItemResponseSchema } from '@/http/schemas/hr/payroll/payroll.schema';
import { payrollItemToDTO } from '@/mappers/hr/payroll-item/payroll-item-to-dto';
import { makeGetMyEmployeeUseCase } from '@/use-cases/hr/employees/factories/make-get-my-employee-use-case';
import { PrismaPayrollItemsRepository } from '@/repositories/hr/prisma/prisma-payroll-items-repository';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function listMyPayrollItemsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/me/payroll-items',
    preHandler: [verifyJwt],
    schema: {
      tags: ['Me'],
      summary: 'List my payroll items (salary history)',
      querystring: z.object({
        referenceMonth: z.coerce.number().int().min(1).max(12).optional(),
        referenceYear: z.coerce.number().int().min(2000).max(2100).optional(),
      }),
      response: {
        200: z.object({
          payrollItems: z.array(payrollItemResponseSchema),
        }),
        404: z.object({ message: z.string() }),
      },
    },
    handler: async (request, reply) => {
      const userId = request.user.sub;

      try {
        // First get my employee record
        const getMyEmployeeUseCase = makeGetMyEmployeeUseCase();
        const { employee } = await getMyEmployeeUseCase.execute({ userId });

        // Then list my payroll items
        const payrollItemsRepository = new PrismaPayrollItemsRepository();
        const payrollItems = await payrollItemsRepository.findManyByEmployee(
          new UniqueEntityID(employee.id.toString()),
        );

        return reply.status(200).send({
          payrollItems: payrollItems.map(payrollItemToDTO),
        });
      } catch (err) {
        if (err instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: err.message });
        }
        throw err;
      }
    },
  });
}
