import { PermissionCodes } from '@/constants/rbac';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  checkInKeyResultSchema,
  okrCheckInResponseSchema,
} from '@/http/schemas/hr/okrs';
import { cuidSchema } from '@/http/schemas/common.schema';
import { okrCheckInToDTO } from '@/mappers/hr/okr-check-in';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { makeCheckInKeyResultUseCase } from '@/use-cases/hr/okrs/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CheckInKeyResultController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/okrs/key-results/:keyResultId/check-ins',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OKRS.REGISTER,
        resource: 'okrs',
      }),
    ],
    schema: {
      tags: ['HR - OKRs'],
      summary: 'Check-in on a key result',
      description:
        'Creates a check-in, updates the current value, and recalculates objective progress',
      params: z.object({ keyResultId: cuidSchema }),
      body: checkInKeyResultSchema,
      response: {
        201: okrCheckInResponseSchema,
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const userId = request.user.sub;
      const { keyResultId } = request.params;
      const { newValue, note, confidence } = request.body;

      // OKRCheckIn.employeeId is a FK to Employee, NOT User. Resolve the
      // Employee record tied to the authenticated user within this tenant
      // before persisting the check-in.
      const employeesRepository = new PrismaEmployeesRepository();
      const authorEmployee = await employeesRepository.findByUserId(
        new UniqueEntityID(userId),
        tenantId,
      );

      if (!authorEmployee) {
        return reply
          .status(404)
          .send({ message: 'No employee linked to the current user in this tenant' });
      }

      const useCase = makeCheckInKeyResultUseCase();
      const { checkIn } = await useCase.execute({
        tenantId,
        keyResultId,
        employeeId: authorEmployee.id.toString(),
        newValue,
        note,
        confidence,
      });

      return reply.status(201).send(okrCheckInToDTO(checkIn));
    },
  });
}
