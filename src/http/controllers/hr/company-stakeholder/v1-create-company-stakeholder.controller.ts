import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { idSchema } from '@/http/schemas/common.schema';
import {
  companyStakeholderResponseSchema,
  createCompanyStakeholderSchema,
} from '@/http/schemas/hr.schema';
import { companyStakeholderToDTO } from '@/mappers/hr/company-stakeholder';
import { makeCreateCompanyStakeholderUseCase } from '@/use-cases/hr/company-stakeholder/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateCompanyStakeholder(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/companies/:companyId/stakeholders',
    preHandler: [
      verifyJwt,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.COMPANY_STAKEHOLDER.CREATE,
        resource: 'company-stakeholder',
      }),
    ],
    schema: {
      tags: ['HR - Company Stakeholders'],
      summary: 'Create company stakeholder',
      params: z.object({ companyId: idSchema }),
      body: createCompanyStakeholderSchema,
      response: {
        201: companyStakeholderResponseSchema,
        400: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const { companyId } = request.params as { companyId: string };
      const data = request.body;

      try {
        const useCase = makeCreateCompanyStakeholderUseCase();
        const { stakeholder } = await useCase.execute({
          companyId,
          ...data,
        });

        return reply.status(201).send(companyStakeholderToDTO(stakeholder));
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
