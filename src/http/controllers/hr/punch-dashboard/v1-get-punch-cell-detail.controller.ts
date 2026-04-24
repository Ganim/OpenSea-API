import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  cellDetailResponseSchema,
  getCellDetailQuerySchema,
} from '@/http/schemas/hr/punch/punch-dashboard.schema';
import { prisma } from '@/lib/prisma';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeGetPunchCellDetailUseCase } from '@/use-cases/hr/punch-dashboard/factories/make-get-punch-cell-detail';

import { resolveManagedEmployees } from './v1-get-punch-heatmap.controller';

/**
 * GET /v1/hr/punch/cell-detail?employeeId=<uuid>&date=YYYY-MM-DD
 *
 * Detalhe de um cell do heatmap — substitui 3 round-trips do frontend
 * (timeEntries + activeApproval + activeRequests) por 1 chamada (Warning #9).
 *
 * Permissão (OR): hr.punch-approvals.access OU hr.punch-approvals.admin.
 *
 * Scope (T-7-05b-04): gestor não-admin recebe 403 se `employeeId` não estiver
 * em `scopedEmployeeIds` (managed via BFS + delegação + ele próprio).
 */
export async function v1GetPunchCellDetailController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch/cell-detail',
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
      summary:
        'Detalhe da célula (timeEntries + activeApproval + activeRequests)',
      querystring: getCellDetailQuerySchema,
      response: {
        200: cellDetailResponseSchema,
        403: z.object({ message: z.string() }),
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
          return reply
            .status(403)
            .send({ message: 'Sem mapeamento de funcionário' });
        }
        const managed = await resolveManagedEmployees(myEmployee.id, tenantId);
        scopedEmployeeIds = Array.from(new Set([...managed, myEmployee.id]));
      }

      const useCase = makeGetPunchCellDetailUseCase();
      try {
        const result = await useCase.execute({
          tenantId,
          employeeId: query.employeeId,
          date: new Date(`${query.date}T00:00:00.000Z`),
          scopedEmployeeIds,
        });
        return reply.status(200).send(result);
      } catch (err) {
        if (err instanceof Error && err.message.startsWith('FORBIDDEN')) {
          return reply
            .status(403)
            .send({ message: 'Funcionário fora do escopo gerenciado' });
        }
        throw err;
      }
    },
  });
}

/** Alias com nome estável esperado pelo aggregator. */
export const punchDashboardCellDetailRoutes = v1GetPunchCellDetailController;
