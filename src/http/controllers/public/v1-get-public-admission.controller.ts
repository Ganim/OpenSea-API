import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { publicAdmissionResponseSchema } from '@/http/schemas/hr/admission';
import { makeGetPublicAdmissionUseCase } from '@/use-cases/hr/admissions/factories/make-get-public-admission-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1GetPublicAdmissionController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/admission/:token',
    schema: {
      tags: ['Public - Admission'],
      summary: 'Get admission invite by public token',
      description:
        'Public endpoint for candidates to access their admission invite. No authentication required.',
      params: z.object({ token: z.string().uuid() }),
      response: {
        200: z.object({ invite: publicAdmissionResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;

      try {
        const useCase = makeGetPublicAdmissionUseCase();
        const { invite } = await useCase.execute({ token });

        // Return a sanitized version (no tenantId exposed)
        const publicInvite = {
          id: invite.id,
          token: invite.token,
          fullName: invite.fullName,
          email: invite.email,
          phone: invite.phone,
          positionId: invite.positionId,
          departmentId: invite.departmentId,
          expectedStartDate: invite.expectedStartDate,
          salary: invite.salary,
          contractType: invite.contractType,
          workRegime: invite.workRegime,
          status: invite.status,
          candidateData: invite.candidateData,
          expiresAt: invite.expiresAt,
          documents: invite.documents,
          signatures: invite.signatures,
        };

        return reply.status(200).send({ invite: publicInvite });
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
