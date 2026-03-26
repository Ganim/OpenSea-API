import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { cipaMandateResponseSchema } from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { cipaMandateToDTO } from '@/mappers/hr/cipa-mandate';
import { makeGetCipaMandateUseCase } from '@/use-cases/hr/cipa-mandates/factories/make-get-cipa-mandate-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetCipaMandateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/cipa-mandates/:mandateId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - CIPA'],
      summary: 'Get CIPA mandate',
      description: 'Gets a CIPA mandate by ID',
      params: z.object({
        mandateId: idSchema,
      }),
      response: {
        200: z.object({
          cipaMandate: cipaMandateResponseSchema,
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { mandateId } = request.params;

      try {
        const useCase = makeGetCipaMandateUseCase();
        const { cipaMandate } = await useCase.execute({
          tenantId,
          mandateId,
        });

        return reply
          .status(200)
          .send({ cipaMandate: cipaMandateToDTO(cipaMandate) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
