import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { companyToDTO } from '@/mappers/hr/company/company-to-dto';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeGetCompanyByIdUseCase,
  makeUpdateCompanyUseCase,
} from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';
import {
  companyResponseSchema,
  updateCompanyRequestSchema,
  wrapCompanyResponse,
} from './company-api-schemas';

export async function v1UpdateCompanyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/companies/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANIES.UPDATE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Update a company',
      description: 'Updates the information of an existing company',
      params: z.object({
        id: idSchema,
      }),
      body: updateCompanyRequestSchema,
      response: {
        200: companyResponseSchema,
        400: z.object({
          message: z.string(),
        }),
        404: z.object({
          message: z.string(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { id } = request.params as { id: string };
      const data = request.body;
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getCompanyByIdUseCase = makeGetCompanyByIdUseCase();

        const [{ user }, { company: oldCompany }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getCompanyByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const updateCompanyUseCase = makeUpdateCompanyUseCase();
        const { company } = await updateCompanyUseCase.execute({
          tenantId,
          id,
          ...data,
        });

        if (!company) {
          return reply.status(404).send({ message: 'Company not found' });
        }

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPANY_UPDATE,
          entityId: id,
          placeholders: {
            userName,
            companyName: company.tradeName || company.legalName,
          },
          oldData: {
            legalName: oldCompany.legalName,
            tradeName: oldCompany.tradeName,
          },
          newData: data,
        });

        return reply
          .status(200)
          .send(wrapCompanyResponse(companyToDTO(company)));
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof Error && error.message.includes('not found')) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof Error) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
