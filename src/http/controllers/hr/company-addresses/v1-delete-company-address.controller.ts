import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas';
import { makeDeleteCompanyAddressUseCase } from '@/use-cases/hr/company-addresses/factories/make-company-addresses';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function deleteCompanyAddressController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/companies/:companyId/addresses/:addressId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_ADDRESSES.DELETE,
        resource: 'company-addresses',
      }),
    ],
    schema: {
      tags: ['HR - Company Addresses'],
      summary: 'Delete a company address',
      params: z.object({
        companyId: idSchema,
        addressId: idSchema,
      }),
      response: {
        204: z.null(),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId, addressId } = request.params as {
        companyId: string;
        addressId: string;
      };

      const useCase = makeDeleteCompanyAddressUseCase();
      await useCase.execute({ companyId, addressId });

      return reply.status(204).send();
    },
  });
}
