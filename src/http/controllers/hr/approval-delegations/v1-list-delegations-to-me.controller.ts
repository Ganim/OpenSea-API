import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { approvalDelegationToDTO } from '@/mappers/hr/approval-delegation/approval-delegation-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeListDelegationsToMeUseCase } from '@/use-cases/hr/approval-delegations/factories/make-list-delegations-to-me-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListDelegationsToMeController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/approval-delegations/incoming',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DELEGATIONS.ACCESS,
        resource: 'delegations',
      }),
    ],
    schema: {
      tags: ['HR - Approval Delegations'],
      summary: 'List delegations received by me',
      description:
        'Returns a paginated list of approval delegations where the logged-in employee is the delegate',
      querystring: z.object({
        page: z.coerce.number().int().positive().default(1),
        limit: z.coerce.number().int().positive().max(100).default(20),
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
              delegatorName: z.string().optional(),
              delegateName: z.string().optional(),
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
          delegations: [],
          meta: { total: 0, page, limit, pages: 0 },
        });
      }

      const listDelegationsToMeUseCase = makeListDelegationsToMeUseCase();
      const { delegations, total } = await listDelegationsToMeUseCase.execute({
        tenantId,
        delegateId: employee.id.toString(),
        page,
        limit,
      });

      return reply.status(200).send({
        delegations: delegations.map((delegation) => {
          const extra = delegation as unknown as Record<string, unknown>;
          return approvalDelegationToDTO(
            delegation,
            extra._delegatorName as string | undefined,
            extra._delegateName as string | undefined,
          );
        }),
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
