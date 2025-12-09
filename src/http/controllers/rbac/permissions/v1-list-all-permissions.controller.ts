import { makeListAllPermissionsUseCase } from '@/use-cases/rbac/permissions/factories/make-list-all-permissions-use-case';
import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Controller para listar todas as permissões agrupadas por módulo
 *
 * @route GET /v1/rbac/permissions/all
 * @auth Requer autenticação
 * @permission rbac.permissions.list
 */
export async function listAllPermissions(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const useCase = makeListAllPermissionsUseCase();

  const result = await useCase.execute();

  return reply.status(200).send({
    permissions: result.permissions,
    total: result.total,
    modules: result.modules,
  });
}
