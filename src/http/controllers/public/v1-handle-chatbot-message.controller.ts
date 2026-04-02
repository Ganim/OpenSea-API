import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  chatbotMessageBodySchema,
  chatbotMessageResponseSchema,
} from '@/http/schemas/sales/chatbot/chatbot.schema';
import { makeHandleChatbotMessageUseCase } from '@/use-cases/sales/chatbot/factories/make-handle-chatbot-message-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

export async function handleChatbotMessageController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'POST',
    url: '/v1/public/chatbot/:tenantSlug/message',
    schema: {
      tags: ['Public - Chatbot'],
      summary:
        'Send a message through the chatbot widget (public, no auth). Creates contact and conversation.',
      params: z.object({
        tenantSlug: z.string().min(1).max(128),
      }),
      body: chatbotMessageBodySchema,
      response: {
        201: chatbotMessageResponseSchema,
        400: z.object({ message: z.string() }),
        404: z.object({ message: z.string() }),
      },
    },

    handler: async (request, reply) => {
      const { tenantSlug } = request.params;
      const body = request.body;

      try {
        const useCase = makeHandleChatbotMessageUseCase();
        const result = await useCase.execute({
          tenantSlug,
          name: body.name,
          email: body.email,
          phone: body.phone,
          message: body.message,
        });

        return reply.status(201).send(result as unknown);
      } catch (error) {
        if (error instanceof BadRequestError) {
          return reply.status(400).send({ message: error.message });
        }
        if (error instanceof ResourceNotFoundError) {
          return reply.status(404).send({ message: error.message });
        }
        throw error;
      }
    },
  });
}
