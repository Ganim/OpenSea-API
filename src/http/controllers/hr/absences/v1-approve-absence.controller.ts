import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { absenceResponseSchema, approveAbsenceSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas/common.schema';
import { absenceToDTO } from '@/mappers/hr/absence/absence-to-dto';
import { makeApproveAbsenceUseCase } from '@/use-cases/hr/absences/factories/make-approve-absence-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function approveAbsenceController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/absences/:absenceId/approve',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.ABSENCES.MANAGE,
        resource: 'absences',
      }),
    ],
    schema: {
      tags: ['HR - Absences'],
      summary: 'Approve absence',
      description: 'Approves a pending absence request',
      params: z.object({
        absenceId: idSchema,
      }),
      body: approveAbsenceSchema,
      response: {
        200: z.object({
          absence: absenceResponseSchema,
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
      const { absenceId } = request.params;
      const userId = request.user.sub;

      try {
        const approveAbsenceUseCase = makeApproveAbsenceUseCase();
        const { absence } = await approveAbsenceUseCase.execute({
          tenantId,
          absenceId,
          approvedBy: userId,
        });

        return reply.status(200).send({ absence: absenceToDTO(absence) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('not found')
        ) {
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
