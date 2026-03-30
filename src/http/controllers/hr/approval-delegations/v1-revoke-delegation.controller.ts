import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logAudit } from '@/http/helpers/audit.helper';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { approvalDelegationToDTO } from '@/mappers/hr/approval-delegation/approval-delegation-to-dto';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeRevokeDelegationUseCase } from '@/use-cases/hr/approval-delegations/factories/make-revoke-delegation-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1RevokeDelegationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/approval-delegations/:delegationId/revoke',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Approval Delegations'],
      summary: 'Revoke an approval delegation',
      description:
        'Revokes an active approval delegation. Only the delegator can revoke their own delegation.',
      params: z.object({
        delegationId: z.string().uuid(),
      }),
      response: {
        200: z.object({
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
      const { delegationId } = request.params;

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
        const revokeDelegationUseCase = makeRevokeDelegationUseCase();
        const { delegation } = await revokeDelegationUseCase.execute({
          tenantId,
          delegationId,
          revokedBy: employee.id.toString(),
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.DELEGATION_REVOKE,
          entityId: delegation.id.toString(),
          placeholders: {
            userName: userId,
            delegateName: delegation.delegateId.toString(),
          },
        });

        return reply.status(200).send({
          delegation: approvalDelegationToDTO(delegation),
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
