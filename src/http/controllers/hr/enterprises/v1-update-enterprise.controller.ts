import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { verifyJwt } from '@/http/middlewares/verify-jwt';
import { verifyUserManager } from '@/http/middlewares/verify-user-manager';
import {
  updateEnterpriseSchema,
  enterpriseResponseSchema,
} from '@/http/schemas';
import { enterpriseToDTO } from '@/mappers/hr/enterprise/enterprise-to-dto';
import { makeUpdateEnterpriseUseCase } from '@/use-cases/hr/enterprises/factories/make-enterprises';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateEnterpriseController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/enterprises/:id',
    preHandler: [verifyJwt, verifyUserManager],
    schema: {
      tags: ['HR - Enterprises'],
      summary: 'Update an enterprise',
      description: 'Updates the information of an existing enterprise',
      params: z.object({
        id: z.string().uuid(),
      }),
      body: updateEnterpriseSchema,
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
      const data = request.body;

      try {
        const updateEnterpriseUseCase = makeUpdateEnterpriseUseCase();
        const { enterprise } = await updateEnterpriseUseCase.execute({
          id,
          legalName: data.legalName,
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
