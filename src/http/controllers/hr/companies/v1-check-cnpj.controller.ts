import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeGetCompanyByCnpjUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  checkCnpjResponseSchema,
  wrapCheckCnpjResponse,
} from './company-api-schemas';

export async function v1CheckCnpjController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies/check-cnpj',
    preHandler: [verifyJwt],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Check if CNPJ exists',
      description: 'Checks if a company with the given CNPJ already exists',
      body: z.object({
        cnpj: z
          .string()
          .regex(/^[0-9]{14}$|^[0-9]{2}\.[0-9]{3}\.[0-9]{3}\/\d{4}-\d{2}$/),
      }),
      response: {
        200: checkCnpjResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const { cnpj } = request.body;

      try {
        const getCompanyByCnpjUseCase = makeGetCompanyByCnpjUseCase();
        const result = await getCompanyByCnpjUseCase.execute({
          cnpj,
        });

        return reply
          .status(200)
          .send(
            wrapCheckCnpjResponse(
              result.company ? companyToDTO(result.company) : null,
            ),
          );
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
