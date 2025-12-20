import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  createEnterpriseSchema,
  enterpriseResponseSchema,
} from '@/http/schemas';
import { enterpriseToDTO } from '@/mappers/hr/enterprise/enterprise-to-dto';
import { makeCreateEnterpriseUseCase } from '@/use-cases/hr/enterprises/factories/make-enterprises';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createEnterpriseController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/enterprises',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Enterprises'],
      summary: 'Create a new enterprise',
      description: 'Creates a new enterprise in the system',
      body: createEnterpriseSchema,
      response: {
        201: z.object({
          enterprise: enterpriseResponseSchema,
        }),
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const data = request.body;

      try {
        const createEnterpriseUseCase = makeCreateEnterpriseUseCase();
        const { enterprise } = await createEnterpriseUseCase.execute({
          legalName: data.legalName,
          cnpj: data.cnpj,
          taxRegime: data.taxRegime,
          phone: data.phone,
          address: data.address,
          addressNumber: data.addressNumber,
          complement: data.complement,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          logoUrl: data.logoUrl,
        });

        return reply.status(201).send({
          enterprise: enterpriseToDTO(enterprise),
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
