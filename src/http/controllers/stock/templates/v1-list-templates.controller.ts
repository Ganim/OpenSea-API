import { makeListTemplatesUseCase } from '@/use-cases/stock/templates/factories/make-list-templates-use-case';
import { FastifyReply, FastifyRequest } from 'fastify';

export async function v1ListTemplatesController(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const listTemplatesUseCase = makeListTemplatesUseCase();

  const { templates } = await listTemplatesUseCase.execute();

  return reply.status(200).send({ templates });
}

v1ListTemplatesController.schema = {
  tags: ['stock/templates'],
  summary: 'List all templates',
  description: 'Retrieves a list of all templates with their attributes',
};
