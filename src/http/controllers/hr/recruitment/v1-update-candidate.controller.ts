import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { AUDIT_MESSAGES } from '@/constants/audit-messages';
import { PermissionCodes } from '@/constants/rbac';
import { logAudit } from '@/http/helpers/audit.helper';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  candidateResponseSchema,
  updateCandidateSchema,
} from '@/http/schemas/hr/recruitment';
import { cuidSchema } from '@/http/schemas/common.schema';
import { candidateToDTO } from '@/mappers/hr/candidate';
import { makeUpdateCandidateUseCase } from '@/use-cases/hr/candidates/factories';

import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1UpdateCandidateController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'PUT',
    url: '/v1/hr/recruitment/candidates/:candidateId',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.RECRUITMENT.MODIFY,
        resource: 'recruitment',
      }),
    ],
    schema: {
      tags: ['HR - Recruitment'],
      summary: 'Update candidate',
      description: 'Updates an existing candidate',
      params: z.object({ candidateId: cuidSchema }),
      body: updateCandidateSchema,
      response: {
        200: z.object({ candidate: candidateResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
      security: [{ bearerAuth: [] }],
    },

    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const { candidateId } = request.params;
      const candidateData = request.body;

      try {
        const useCase = makeUpdateCandidateUseCase();
        const { candidate } = await useCase.execute({
          tenantId,
          candidateId,
          ...candidateData,
        });

        await logAudit(request, {
          message: AUDIT_MESSAGES.HR.CANDIDATE_UPDATE,
          entityId: candidate.id.toString(),
          placeholders: {
            userName: request.user.sub,
            candidateName: candidate.fullName,
          },
          newData: candidateData as Record<string, unknown>,
        });

        return reply.status(200).send({ candidate: candidateToDTO(candidate) });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
