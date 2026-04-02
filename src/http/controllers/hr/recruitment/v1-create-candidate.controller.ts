import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  candidateResponseSchema,
  createCandidateSchema,
} from '@/http/schemas/hr/recruitment';
import { candidateToDTO } from '@/mappers/hr/candidate';
import { makeCreateCandidateUseCase } from '@/use-cases/hr/candidates/factories';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1CreateCandidateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/hr/recruitment/candidates',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.REGISTER,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Create candidate',
      description: 'Creates a new candidate in the ATS',
      body: createCandidateSchema,
      response: {
        201: z.object({ candidate: candidateResponseSchema }),
        400: z.object({ message: z.string() }),
        409: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const data = request.body;
      try {
        const useCase = makeCreateCandidateUseCase();
        const { candidate } = await useCase.execute({ tenantId, ...data });
        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.CANDIDATE_CREATE,
          entityId: candidate.id.toString(),
          placeholders: {
            userName: request.user.sub,
            candidateName: candidate.fullName,
          },
          newData: data as Record<string, unknown>,
        });
        return reply.status(201).send({ candidate: candidateToDTO(candidate) });
      } catch (error) {
        if (error instanceof ConflictError)
          return reply.status(409).send({ message: error.message });
        if (error instanceof Error)
          return reply.status(400).send({ message: error.message });
        throw error;
      }
    },
  });
}
