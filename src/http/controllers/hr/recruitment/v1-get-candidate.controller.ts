import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { candidateResponseSchema } from '@/http/schemas/hr/recruitment';
import { idSchema } from '@/http/schemas/common.schema';
import { candidateToDTO } from '@/mappers/hr/candidate';
import { makeGetCandidateUseCase } from '@/use-cases/hr/candidates/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetCandidateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/recruitment/candidates/:candidateId',
    preHandler: [verifyJwt, verifyTenant],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Get candidate',
      description: 'Gets a candidate by ID',
      params: z.object({ candidateId: idSchema }),
      response: { 200: z.object({ candidate: candidateResponseSchema }), 404: z.object({ message: z.string() }) },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { candidateId } = request.params;
      try {
        const useCase = makeGetCandidateUseCase();
        const { candidate } = await useCase.execute({ tenantId, candidateId });
        return reply.status(200).send({ candidate: candidateToDTO(candidate) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) return reply.status(404).send({ message: error.message });
        throw error;
      }
    },
  });
}
