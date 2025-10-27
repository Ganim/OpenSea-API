import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteNotificationPreferenceUseCase } from '@/use-cases/sales/notification-preferences/factories/make-delete-notification-preference-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function v1DeleteNotificationPreferenceController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  try {
    const params = paramsSchema.parse(request.params);

    const useCase = makeDeleteNotificationPreferenceUseCase();
    await useCase.execute({ id: params.id });

    return reply.status(204).send();
  } catch (err) {
    if (err instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: err.message });
    }
    throw err;
  }
}

v1DeleteNotificationPreferenceController.schema = {
  tags: ['Notification Preferences'],
  summary: 'Delete a notification preference (soft delete)',
  security: [{ bearerAuth: [] }],
  params: paramsSchema,
  response: {
    204: z.null().describe('No content'),
    404: z.object({ message: z.string() }),
  },
} as const;
