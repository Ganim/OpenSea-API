import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  listMissedQuerySchema,
  listMissedResponseSchema,
} from '@/http/schemas/hr/punch/punch-dashboard.schema';
import { prisma } from '@/lib/prisma';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeListMissedPunchesUseCase } from '@/use-cases/hr/punch-dashboard/factories/make-list-missed-punches';

import { resolveManagedEmployees } from './v1-get-punch-heatmap.controller';

/**
 * GET /v1/hr/punch/missing?date=YYYY-MM-DD&page=&pageSize=
 *
 * Lista paginada de PunchMissedLog (gerados pelo scheduler 22h em 07-05a).
 *
 * Permissão (OR): hr.punch-approvals.access OU hr.punch-approvals.admin.
 *
 * Scope: gestor não-admin vê apenas missed-logs de employees gerenciados
 * (BFS recursivo + delegação) + dele próprio. Admin vê tenant inteiro.
 */
export async function v1ListMissedPunchesController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch/missing',
    preHandler: [
      verifyJwt,
      verifyTenant,
      createAnyPermissionMiddleware([
        PermissionCodes.HR.PUNCH_APPROVALS.ACCESS,
        PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
      ]),
    ],
    schema: {
      tags: ['HR - Punch Dashboard'],
      summary: 'Lista paginada de batidas faltantes detectadas',
      description:
        'Retorna PunchMissedLog do dia escolhido. LGPD-safe: sem CPF (apenas employeeName + departmentName).',
      querystring: listMissedQuerySchema,
      response: {
        200: listMissedResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;
      const query = request.query;

      const permissionService = getPermissionService();
      const adminCheck = await permissionService.checkPermission({
        userId: new UniqueEntityID(request.user.sub),
        permissionCode: PermissionCodes.HR.PUNCH_APPROVALS.ADMIN,
      });
      const isAdmin = adminCheck.allowed;

      let scopedEmployeeIds: string[] | undefined;
      if (!isAdmin) {
        const myEmployee = await prisma.employee.findFirst({
          where: { userId: request.user.sub, tenantId, deletedAt: null },
          select: { id: true },
        });
        if (!myEmployee) {
          return reply.status(200).send({
            items: [],
            total: 0,
            page: query.page,
            pageSize: query.pageSize,
          });
        }
        const managed = await resolveManagedEmployees(myEmployee.id, tenantId);
        scopedEmployeeIds = Array.from(new Set([...managed, myEmployee.id]));
      }

      const useCase = makeListMissedPunchesUseCase();
      const result = await useCase.execute({
        tenantId,
        date: new Date(`${query.date}T00:00:00.000Z`),
        page: query.page,
        pageSize: query.pageSize,
        scopedEmployeeIds,
      });
      return reply.status(200).send(result);
    },
  });
}

/** Alias com nome estável esperado pelo aggregator. */
export const punchMissedPunchesRoutes = v1ListMissedPunchesController;
