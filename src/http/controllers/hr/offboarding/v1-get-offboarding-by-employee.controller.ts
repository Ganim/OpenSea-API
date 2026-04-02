import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { offboardingChecklistResponseSchema } from '@/http/schemas/hr/offboarding';
import { offboardingChecklistToDTO } from '@/mappers/hr/offboarding-checklist';
import { makeGetOffboardingByEmployeeUseCase } from '@/use-cases/hr/offboarding/factories/make-get-offboarding-by-employee-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetOffboardingByEmployeeController(
  app: FastifyInstance,
) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/offboarding/employee/:employeeId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.OFFBOARDING.ACCESS,
        resource: 'offboarding',
      }),
    ],
    schema: {
      tags: ['HR - Offboarding'],
      summary: 'Get offboarding checklist by employee',
      description: 'Returns the offboarding checklist for a specific employee',
      params: z.object({
        employeeId: idSchema,
      }),
      response: {
        200: z.object({
          checklist: offboardingChecklistResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { employeeId } = request.params;

      try {
        const getOffboardingByEmployeeUseCase =
          makeGetOffboardingByEmployeeUseCase();
        const { checklist } = await getOffboardingByEmployeeUseCase.execute({
          tenantId,
          employeeId,
        });

        return reply.status(200).send({
          checklist: offboardingChecklistToDTO(checklist),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
