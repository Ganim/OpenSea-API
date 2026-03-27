import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  allocateFlexBenefitsSchema,
  flexBenefitAllocationResponseSchema,
} from '@/http/schemas/hr/benefits';
import { flexBenefitAllocationToDTO } from '@/mappers/hr/flex-benefit-allocation';
import { makeAllocateFlexBenefitsUseCase } from '@/use-cases/hr/flex-benefits/factories/make-allocate-flex-benefits-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1AllocateFlexBenefitsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/flex-benefits/allocate',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.BENEFITS.REGISTER,
        resource: 'flex-benefits',
      }),
    ],
    schema: {
      tags: ['HR - Benefits'],
      summary: 'Allocate flex benefits',
      description: 'Distributes a budget across benefit categories',
      body: allocateFlexBenefitsSchema,
      response: {
        201: z.object({
          allocation: flexBenefitAllocationResponseSchema,
        }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;

      try {
        const useCase = makeAllocateFlexBenefitsUseCase();
        const { allocation } = await useCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.FLEX_BENEFIT_ALLOCATE,
          entityId: allocation.id.toString(),
          placeholders: {
            userName: request.user.sub,
            employeeName: data.employeeId,
            month: String(data.month),
            year: String(data.year),
          },
          newData: data as Record<string, unknown>,
        });

        return reply.status(201).send({
          allocation: flexBenefitAllocationToDTO(allocation),
        });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
