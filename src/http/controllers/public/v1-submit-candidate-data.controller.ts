import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { submitCandidateDataSchema } from '@/http/schemas/hr/admission';
import { makeSubmitCandidateDataUseCase } from '@/use-cases/hr/admissions/factories/make-submit-candidate-data-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1SubmitCandidateDataController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/public/admission/:token/submit',
    schema: {
      tags: ['Public - Admission'],
      summary: 'Submit candidate data',
      description:
        'Public endpoint for candidates to submit their personal data. No authentication required.',
      params: z.object({ token: z.string().uuid() }),
      body: submitCandidateDataSchema,
      response: {
        200: z.object({ message: z.string() }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;
      const { candidateData } = request.body;

      try {
        const useCase = makeSubmitCandidateDataUseCase();
        await useCase.execute({ token, candidateData });

        return reply
          .status(200)
          .send({ message: 'Candidate data submitted successfully' });
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
