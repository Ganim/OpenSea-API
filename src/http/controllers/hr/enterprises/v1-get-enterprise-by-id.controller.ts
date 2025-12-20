import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { enterpriseResponseSchema } from '@/http/schemas';
import { enterpriseToDTO } from '@/mappers/hr/enterprise/enterprise-to-dto';
import { makeGetEnterpriseByIdUseCase } from '@/use-cases/hr/enterprises/factories/make-enterprises';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function getEnterpriseByIdController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/enterprises/:id',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Enterprises'],
      summary: 'Get enterprise by ID',
      description: 'Retrieves a single enterprise by its ID',
      params: z.object({
        id: z.string().uuid(),
      }),
      response: {
        200: z.object({
          enterprise: enterpriseResponseSchema.nullable(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { id } = request.params;

      try {
        const getEnterpriseUseCase = makeGetEnterpriseByIdUseCase();
        const { enterprise } = await getEnterpriseUseCase.execute({ id });

        return reply.status(200).send({
          enterprise: enterprise ? enterpriseToDTO(enterprise) : null,
        });
      } catch (error) {
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
