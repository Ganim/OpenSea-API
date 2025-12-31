import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import {
  companyStakeholderResponseSchema,
  updateCompanyStakeholderSchema,
} from '@/http/schemas/hr.schema';
import { companyStakeholderToDTO } from '@/mappers/hr/company-stakeholder';
import { makeUpdateCompanyStakeholderUseCase } from '@/use-cases/hr/company-stakeholder/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateCompanyStakeholder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PATCH',
    url: '/v1/hr/companies/:companyId/stakeholders/:stakeholderId',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_STAKEHOLDER.UPDATE,
        resource: 'company-stakeholder',
      }),
    ],
    schema: {
      tags: ['HR - Company Stakeholders'],
      summary: 'Update company stakeholder',
      params: z.object({
        companyId: idSchema,
        stakeholderId: idSchema,
      }),
      body: updateCompanyStakeholderSchema,
      response: {
        200: companyStakeholderResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId, stakeholderId } = request.params as {
        companyId: string;
        stakeholderId: string;
      };
      const data = request.body;

      try {
        const useCase = makeUpdateCompanyStakeholderUseCase();
        const { stakeholder } = await useCase.execute({
          id: stakeholderId,
          companyId,
          ...data,
        });

        return reply.status(200).send(companyStakeholderToDTO(stakeholder));
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
