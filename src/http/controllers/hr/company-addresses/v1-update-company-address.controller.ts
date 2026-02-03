import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  companyAddressResponseSchema,
  idSchema,
  updateCompanyAddressSchema,
} from '@/http/schemas';
import { companyAddressToDTO } from '@/mappers/hr/company-address';
import { makeUpdateCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function updateCompanyAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/companies/:companyId/addresses/:addressId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_ADDRESSES.UPDATE,
        resource: 'company-addresses',
      }),
    ],
    schema: {
      tags: ['HR - Company Addresses'],
      summary: 'Update a company address',
      params: z.object({
        companyId: idSchema,
        addressId: idSchema,
      }),
      body: updateCompanyAddressSchema,
      response: {
        200: z.object({ address: companyAddressResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const data = request.body;
      const { companyId, addressId } = request.params as {
        companyId: string;
        addressId: string;
      };

      try {
        const useCase = makeUpdateCompanyAddressUseCase();
        const { address } = await useCase.execute({
          companyId,
          addressId,
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

        if (!address) {
          return reply.status(404).send({ message: 'Address not found' });
        }

        return reply
          .status(200)
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
