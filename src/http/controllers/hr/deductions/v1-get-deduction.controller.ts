import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { deductionResponseSchema, idSchema } from '@/http/schemas';
import { deductionToDTO } from '@/mappers/hr/deduction';
import { makeGetDeductionUseCase } from '@/use-cases/hr/deductions/factories/make-get-deduction-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getDeductionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/deductions/:deductionId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Deduction'],
      summary: 'Get deduction',
      description: 'Gets a deduction by ID',
      params: z.object({
        deductionId: idSchema,
      }),
      response: {
        200: z.object({
          deduction: deductionResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { deductionId } = request.params;

      try {
        const getDeductionUseCase = makeGetDeductionUseCase();
        const { deduction } = await getDeductionUseCase.execute({
          tenantId,
          deductionId,
        });

        return reply.status(200).send({ deduction: deductionToDTO(deduction) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (
          error instanceof Error &&
          error.message.toLowerCase().includes('não encontrad')
        ) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
