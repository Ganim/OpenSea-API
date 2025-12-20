import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { checkCnpjSchema } from '@/http/schemas';
import { makeGetEnterpriseByCnpjUseCase } from '@/use-cases/hr/enterprises/factories/make-enterprises';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function checkEnterpriseCnpjController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/enterprises/check-cnpj',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Enterprises'],
      summary: 'Check if CNPJ exists',
      description: 'Checks if an enterprise with the given CNPJ already exists',
      body: checkCnpjSchema,
      response: {
        200: z.object({
          exists: z.boolean(),
          enterpriseId: z.string().uuid().optional(),
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { cnpj } = request.body;

      try {
        const getEnterpriseByCnpjUseCase = makeGetEnterpriseByCnpjUseCase();
        const result = await getEnterpriseByCnpjUseCase.execute({
          cnpj,
        });

        return reply.status(200).send(result);
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
