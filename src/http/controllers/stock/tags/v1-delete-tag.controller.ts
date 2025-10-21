import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteTagUseCase } from '@/use-cases/stock/tags/factories/make-delete-tag-use-case';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';

const paramsSchema = z.object({
  id: z.string().uuid(),
});

export async function v1DeleteTagController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = paramsSchema.parse(request.params);

  const deleteTagUseCase = makeDeleteTagUseCase();

  try {
    await deleteTagUseCase.execute({ id });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteTagController.schema = {
  summary: 'Delete tag',
  tags: ['Tags'],
  params: paramsSchema,
  response: {
    204: z.null(),
  },
};
