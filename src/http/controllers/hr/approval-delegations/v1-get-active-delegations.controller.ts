import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { DelegationScope } from '@/entities/hr/approval-delegation';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { approvalDelegationToDTO } from '@/mappers/hr/approval-delegation/approval-delegation-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeGetActiveDelegationUseCase } from '@/use-cases/hr/approval-delegations/factories/make-get-active-delegation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetActiveDelegationsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/approval-delegations/active',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Approval Delegations'],
      summary: 'Get currently active delegations',
      description:
        'Returns the currently effective (active, started, not expired) delegations for the logged-in employee, optionally filtered by scope',
      querystring: z.object({
        scope: z
          .enum(['ALL', 'ABSENCES', 'VACATIONS', 'OVERTIME', 'REQUESTS'])
          .optional(),
      }),
      response: {
        200: z.object({
          delegations: z.array(
            z.object({
              id: z.string(),
              tenantId: z.string(),
              delegatorId: z.string(),
              delegateId: z.string(),
              scope: z.string(),
              startDate: z.date(),
              endDate: z.date().nullable(),
              reason: z.string().nullable(),
              isActive: z.boolean(),
              isEffective: z.boolean(),
              createdAt: z.date(),
              updatedAt: z.date(),
            }),
          ),
        }),
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

      const getActiveDelegationUseCase = makeGetActiveDelegationUseCase();
      const { delegations } = await getActiveDelegationUseCase.execute({
        tenantId,
        delegatorId: employee.id.toString(),
        scope: request.query.scope as DelegationScope | undefined,
      });

      return reply.status(200).send({
        delegations: delegations.map((delegation) =>
          approvalDelegationToDTO(delegation),
        ),
      });
    },
  });
}
