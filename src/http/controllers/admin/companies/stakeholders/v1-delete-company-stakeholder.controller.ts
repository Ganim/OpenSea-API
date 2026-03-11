import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import { makeDeleteCompanyStakeholderUseCase } from '@/use-cases/admin/company-stakeholder/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1DeleteCompanyStakeholder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'DELETE',
    url: '/v1/admin/companies/:companyId/stakeholders/:stakeholderId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.ADMIN.COMPANY_STAKEHOLDER.DELETE,
        resource: 'company-stakeholder',
      }),
    ],
    schema: {
      tags: ['Admin - Company Stakeholders'],
      summary: 'Delete company stakeholder',
      params: z.object({
        companyId: idSchema,
        stakeholderId: idSchema,
      }),
      body: z.object({ anonimize: z.boolean().optional() }).nullish(),
      response: {
        204: z.null(),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { stakeholderId } = request.params as {
        companyId: string;
        stakeholderId: string;
      };
      const { anonimize } = (request.body as { anonimize?: boolean }) || {};

      try {
        const useCase = makeDeleteCompanyStakeholderUseCase();
        await useCase.execute({
          id: stakeholderId,
          anonimize,
        });

        return reply.status(204).send(null);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
