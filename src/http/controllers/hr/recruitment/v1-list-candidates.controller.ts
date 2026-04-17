import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  candidateResponseSchema,
  listCandidatesQuerySchema,
} from '@/http/schemas/hr/recruitment';
import { candidateToDTO } from '@/mappers/hr/candidate';
import { makeListCandidatesUseCase } from '@/use-cases/hr/candidates/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1ListCandidatesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/candidates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.ACCESS,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'List candidates',
      description: 'Lists all candidates with optional filters',
      querystring: listCandidatesQuerySchema,
      response: {
        200: z.object({
          candidates: z.array(candidateResponseSchema),
          total: z.number(),
        }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { tags: tagsString, ...filters } = request.query;
      const tags = tagsString
        ? tagsString.split(',').map((t) => t.trim())
        : undefined;
      const useCase = makeListCandidatesUseCase();
      const { candidates, total } = await useCase.execute({
        tenantId,
        tags,
        ...filters,
      });
      return reply
        .status(200)
        .send({ candidates: candidates.map(candidateToDTO), total });
    },
  });
}
