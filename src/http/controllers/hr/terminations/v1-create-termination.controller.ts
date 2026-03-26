import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  createTerminationSchema,
  terminationResponseSchema,
} from '@/http/schemas';
import { terminationToDTO } from '@/mappers/hr/termination';
import {
  NoticeType,
  TerminationType,
} from '@/entities/hr/termination';
import { makeCreateTerminationUseCase } from '@/use-cases/hr/terminations/factories/make-create-termination-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateTerminationController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/terminations',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.EMPLOYEES.ADMIN,
        resource: 'terminations',
      }),
    ],
    schema: {
      tags: ['HR - Terminations'],
      summary: 'Create termination record',
      description:
        'Creates a termination record for an employee and sets their status to TERMINATED',
      body: createTerminationSchema,
      response: {
        201: z.object({
          termination: terminationResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeCreateTerminationUseCase();
        const { termination } = await useCase.execute({
          tenantId,
          employeeId: data.employeeId,
          type: data.type as TerminationType,
          terminationDate: data.terminationDate,
          lastWorkDay: data.lastWorkDay,
          noticeType: data.noticeType as NoticeType,
          notes: data.notes,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.TERMINATION_CREATE,
          entityId: termination.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: data.employeeId,
            terminationType: data.type,
          },
          newData: data as Record<string, unknown>,
        });

        return reply
          .status(201)
          .send({ termination: terminationToDTO(termination) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
