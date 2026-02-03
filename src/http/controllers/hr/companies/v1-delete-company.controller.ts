import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { idSchema } from '@/http/schemas/common.schema';
import { makeGetUserByIdUseCase } from '@/use-cases/core/users/factories/make-get-user-by-id-use-case';
import {
  makeDeleteCompanyUseCase,
  makeGetCompanyByIdUseCase,
} from '@/use-cases/hr/companies/factories/make-companies';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteCompanyController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/hr/companies/:id',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANIES.DELETE,
        resource: 'companies',
      }),
    ],
    schema: {
      tags: ['HR - Companies'],
      summary: 'Delete a company',
      description: 'Soft deletes a company (marks as deleted)',
      params: z.object({
        id: idSchema,
      }),
      response: {
        204: z.null(),
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
      const userId = request.user.sub;

      try {
        const getUserByIdUseCase = makeGetUserByIdUseCase();
        const getCompanyByIdUseCase = makeGetCompanyByIdUseCase();

        const [{ user }, { company }] = await Promise.all([
          getUserByIdUseCase.execute({ userId }),
          getCompanyByIdUseCase.execute({ tenantId, id }),
        ]);
        const userName = user.profile?.name
          ? `${user.profile.name} ${user.profile.surname || ''}`.trim()
          : user.username || user.email;

        const deleteCompanyUseCase = makeDeleteCompanyUseCase();
        await deleteCompanyUseCase.execute({ tenantId, id });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.COMPANY_DELETE,
          entityId: id,
          placeholders: {
            userName,
            companyName: company.tradeName || company.legalName,
          },
          oldData: {
            id: company.id,
            legalName: company.legalName,
            tradeName: company.tradeName,
          },
        });

        return reply.status(204).send();
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
