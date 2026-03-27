import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  digitalSignatureResponseSchema,
  signDocumentSchema,
} from '@/http/schemas/hr/admission';
import { makeSignAdmissionDocumentUseCase } from '@/use-cases/hr/admissions/factories/make-sign-admission-document-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import z from 'zod';

export async function v1SignAdmissionDocumentController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/public/admission/:token/sign',
    schema: {
      tags: ['Public - Admission'],
      summary: 'Sign admission document',
      description:
        'Public endpoint for candidates to digitally sign admission documents. No authentication required.',
      params: z.object({ token: z.string().uuid() }),
      body: signDocumentSchema,
      response: {
        201: z.object({ signature: digitalSignatureResponseSchema }),
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { token } = request.params;

      try {
        const useCase = makeSignAdmissionDocumentUseCase();
        const { signature } = await useCase.execute({
          token,
          ...request.body,
          ipAddress: request.ip,
          userAgent: request.headers['user-agent'] ?? 'unknown',
        });

        return reply.status(201).send({ signature });
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
