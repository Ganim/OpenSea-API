import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyToDTO } from '@/mappers/core/company/company-to-dto';
import { makeGetCompanyByCnpjUseCase } from '@/use-cases/admin/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  checkCnpjResponseSchema,
  wrapCheckCnpjResponse,
} from '../../hr/companies/company-api-schemas';

export async function v1CheckCnpjController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/admin/companies/check-cnpj',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANIES.ACCESS,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['Admin - Companies'],
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
      const tenantId = request.user.tenantId!;
      const { cnpj } = request.body;

      try {
        const getCompanyByCnpjUseCase = makeGetCompanyByCnpjUseCase();
        const result = await getCompanyByCnpjUseCase.execute({
          tenantId,
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
