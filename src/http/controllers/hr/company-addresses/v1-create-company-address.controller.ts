import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  companyAddressResponseSchema,
  createCompanyAddressSchema,
  idSchema,
} from '@/http/schemas';
import { companyAddressToDTO } from '@/mappers/hr/company-address';
import { makeCreateCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function createCompanyAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies/:companyId/addresses',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_ADDRESSES.CREATE,
        resource: 'company-addresses',
      }),
    ],
    schema: {
      tags: ['HR - Company Addresses'],
      summary: 'Create a new company address',
      params: z.object({ companyId: idSchema }),
      body: createCompanyAddressSchema,
      response: {
        201: z.object({ address: companyAddressResponseSchema }),
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const data = request.body;
      const { companyId } = request.params as { companyId: string };

      try {
        const useCase = makeCreateCompanyAddressUseCase();
        const { address } = await useCase.execute({
          companyId,
          type: data.type,
          street: data.street,
          number: data.number,
          complement: data.complement,
          district: data.district,
          city: data.city,
          state: data.state,
          zip: data.zip,
          ibgeCityCode: data.ibgeCityCode,
          countryCode: data.countryCode,
          isPrimary: data.isPrimary,
        });

        return reply
          .status(201)
          .send({ address: companyAddressToDTO(address) });
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
