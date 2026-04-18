import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createPermissionMiddleware } from '@/http/middlewares/rbac';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listPunchApprovalsQuerySchema,
  listPunchApprovalsResponseSchema,
} from '@/http/schemas/hr/punch/punch-approval.schema';
import { prisma } from '@/lib/prisma';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeListPunchApprovalsUseCase } from '@/use-cases/hr/punch-approvals/factories/make-list-punch-approvals-use-case';
import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

/**
 * GET /v1/hr/punch-approvals
 *
 * Lista paginada de aprovações de ponto do tenant. Filtros: status, reason,
 * employeeId, page, pageSize.
 *
 * Permissão: hr.punch-approvals.access
 *
 * Controle de visibilidade (T-04-15):
 * - Caller com `hr.punch-approvals.admin` vê TODAS as aprovações do tenant
 *   (gestor).
 * - Caller apenas com `hr.punch-approvals.access` (funcionário) fica
 *   restrito às próprias aprovações — força `employeeId` para o id do
 *   Employee vinculado ao userId. Se o usuário não tem `Employee`
 *   associado, retorna lista vazia (não vaza dados de outros).
 */
export async function v1ListPunchApprovalsController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch-approvals',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createPermissionMiddleware({
        permissionCode: PermissionCodes.HR.PUNCH_APPROVALS.ACCESS,
        resource: 'hr-punch-approvals',
      }),
    ],
    schema: {
      tags: ['HR - Punch Approvals'],
      summary: 'Lista aprovações de ponto (pendentes e resolvidas)',
      description:
        'Retorna paginado. Filtros: status, reason, employeeId. Caller sem permissão admin só vê as próprias aprovações.',
      querystring: listPunchApprovalsQuerySchema,
      response: {
        200: listPunchApprovalsResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

      // Determina se o caller tem permissão ADMIN (vê tudo do tenant) ou
      // apenas ACCESS (só as próprias aprovações — T-04-15). Usamos o
      // PermissionService diretamente porque o middleware `createPermissionMiddleware`
      // acima só garante ACCESS; a verificação de ADMIN precisa ser feita
      // no handler pois não bloqueia a requisição — apenas amplia o escopo.
      const permissionService = getPermissionService();
      const adminCheck = await permissionService.checkPermission({
        userId: new UniqueEntityID(request.user.sub),
        permissionCode: PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
      });
      const isAdmin = adminCheck.allowed;

      // Determina o employeeId efetivo do filtro (T-04-15).
      let effectiveEmployeeId = request.query.employeeId;
      if (!isAdmin) {
        const employee = await prisma.employee.findFirst({
          where: {
            userId: request.user.sub,
            tenantId,
            deletedAt: null,
          },
          select: { id: true },
        });
        if (!employee) {
          // Usuário não vinculado a Employee — não vaza aprovações de outros.
          return reply.status(200).send({
            items: [],
            total: 0,
            page: request.query.page,
            pageSize: request.query.pageSize,
          });
        }
        effectiveEmployeeId = employee.id;
      }

      const useCase = makeListPunchApprovalsUseCase();
      const result = await useCase.execute({
        tenantId,
        status: request.query.status,
        reason: request.query.reason,
        employeeId: effectiveEmployeeId,
        page: request.query.page,
        pageSize: request.query.pageSize,
      });

      return reply.status(200).send(result);
    },
  });
}
