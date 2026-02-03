import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import { makeCreateCompanyUseCase } from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  companyResponseSchema,
  createCompanyRequestSchema,
  wrapCompanyResponse,
} from './company-api-schemas';

export async function v1CreateCompanyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANIES.CREATE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Create a new company',
      description: 'Creates a new company in the system',
      body: createCompanyRequestSchema,
      response: {
        201: companyResponseSchema,
        400: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const { user } = await getUserByIdUseCase.execute({ userId });
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const createCompanyUseCase = makeCreateCompanyUseCase();
        const { company } = await createCompanyUseCase.execute({
          tenantId,
          ...data,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPANY_CREATE,
          entityId: company.id.toString(),
          placeholders: {
            userName,
            companyName: company.tradeName || company.legalName,
            cnpj: data.cnpj,
          },
          newData: {
            legalName: data.legalName,
            tradeName: data.tradeName,
            cnpj: data.cnpj,
          },
        });

        return reply
          .status(201)
          .send(wrapCompanyResponse(companyToDTO(company)));
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
