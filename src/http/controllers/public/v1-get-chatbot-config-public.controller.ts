import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { chatbotPublicConfigResponseSchema } from '@/http/schemas/sales/chatbot/chatbot.schema';
import { makeGetPublicChatbotConfigUseCase } from '@/use-cases/sales/chatbot/factories/make-get-public-chatbot-config-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function getPublicChatbotConfigController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/public/chatbot/:tenantSlug/config',
    schema: {
      tags: ['Public - Chatbot'],
      summary: 'Get chatbot public configuration (no auth)',
      params: z.object({
        tenantSlug: z.string().min(1).max(128),
      }),
      response: {
        200: z.object({ config: chatbotPublicConfigResponseSchema }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { tenantSlug } = request.params;

      try {
        const useCase = makeGetPublicChatbotConfigUseCase();
        const { config } = await useCase.execute({ tenantSlug });

        return reply.status(200).send({ config });
      } catch (error) {
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
