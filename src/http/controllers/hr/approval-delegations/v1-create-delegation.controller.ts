import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { approvalDelegationToDTO } from '@/mappers/hr/approval-delegation/approval-delegation-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCreateDelegationUseCase } from '@/use-cases/hr/approval-delegations/factories/make-create-delegation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateDelegationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/approval-delegations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.DELEGATIONS.REGISTER,
        resource: 'delegations',
      }),
    ],
    schema: {
      tags: ['HR - Approval Delegations'],
      summary: 'Create an approval delegation',
      description:
        'Allows a manager to delegate approval authority to another employee for a specified scope and period',
      body: z.object({
        delegateId: z.string().uuid(),
        scope: z.enum(['ALL', 'ABSENCES', 'VACATIONS', 'OVERTIME', 'REQUESTS']),
        startDate: z.coerce.date(),
        endDate: z.coerce.date().optional(),
        reason: z.string().max(500).optional(),
      }),
      response: {
        201: z.object({
          delegation: z.object({
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
      const delegatorEmployee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!delegatorEmployee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to this user' });
      }

      try {
        const createDelegationUseCase = makeCreateDelegationUseCase();
        const { delegation } = await createDelegationUseCase.execute({
          tenantId,
          delegatorId: delegatorEmployee.id.toString(),
          delegateId: request.body.delegateId,
          scope: request.body.scope,
          startDate: request.body.startDate,
          endDate: request.body.endDate,
          reason: request.body.reason,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.DELEGATION_CREATE,
          entityId: delegation.id.toString(),
          placeholders: {
            userName: userId,
            scope: request.body.scope,
            delegateName: request.body.delegateId,
          },
          newData: {
            delegateId: request.body.delegateId,
            scope: request.body.scope,
            startDate: request.body.startDate,
            endDate: request.body.endDate,
            reason: request.body.reason,
          },
        });

        return reply.status(201).send({
          delegation: approvalDelegationToDTO(delegation),
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
