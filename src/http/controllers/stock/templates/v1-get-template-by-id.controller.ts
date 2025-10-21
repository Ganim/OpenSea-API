import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { makeGetTemplateByIdUseCase } from '@/use-cases/stock/templates/factories/make-get-template-by-id-use-case';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function v1GetTemplateByIdController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };

  try {
    const getTemplateByIdUseCase = makeGetTemplateByIdUseCase();

    const { template } = await getTemplateByIdUseCase.execute({
      id,
    });

    return reply.status(200).send({ template });
  } catch (error) {
    if (error instanceof ResourceNotFoundError) {
      return reply.status(404).send({ message: error.message });
    }

    throw error;
  }
}

v1GetTemplateByIdController.schema = {
  tags: ['Templates'],
  summary: 'Get template by ID',
  description: 'Retrieves a single template by its unique identifier',
};
