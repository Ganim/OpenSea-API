import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  workplaceRiskResponseSchema,
  listWorkplaceRisksQuerySchema,
} from '@/http/schemas';
import { idSchema } from '@/http/schemas';
import { workplaceRiskToDTO } from '@/mappers/hr/workplace-risk';
import { makeListWorkplaceRisksUseCase } from '@/use-cases/hr/workplace-risks/factories/make-list-workplace-risks-use-case';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListWorkplaceRisksController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/safety-programs/:programId/risks',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Workplace Risks'],
      summary: 'List workplace risks',
      description: 'Lists all workplace risks for a safety program',
      params: z.object({
        programId: idSchema,
      }),
      querystring: listWorkplaceRisksQuerySchema,
      response: {
        200: z.object({
          workplaceRisks: z.array(workplaceRiskResponseSchema),
        }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { programId } = request.params;
      const filters = request.query;

      const useCase = makeListWorkplaceRisksUseCase();
      const { workplaceRisks } = await useCase.execute({
        tenantId,
        safetyProgramId: programId,
        ...filters,
      });

      return reply.status(200).send({
        workplaceRisks: workplaceRisks.map(workplaceRiskToDTO),
      });
    },
  });
}
