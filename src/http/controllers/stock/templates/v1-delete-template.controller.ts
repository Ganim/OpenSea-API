import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeDeleteTemplateUseCase } from '@/use-cases/stock/templates/factories/make-delete-template-use-case';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function v1DeleteTemplateController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  try {
    const deleteTemplateUseCase = makeDeleteTemplateUseCase();

    await deleteTemplateUseCase.execute({ id });

    return reply.status(204).send();
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1DeleteTemplateController.schema = {
  tags: ['stock/templates'],
  summary: 'Delete a template',
  description: 'Soft deletes a template by setting its deletedAt timestamp',
};
