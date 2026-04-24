import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import { summaryResponseSchema } from '@/http/schemas/hr/punch/punch-dashboard.schema';
import { prisma } from '@/lib/prisma';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeGetPunchDashboardSummaryUseCase } from '@/use-cases/hr/punch-dashboard/factories/make-get-punch-dashboard-summary';

import { resolveManagedEmployees } from './v1-get-punch-heatmap.controller';

/**
 * GET /v1/hr/punch/dashboard/summary
 *
 * 5 contadores agregados para o card-grid superior do dashboard:
 *   - pendingApprovals
 *   - approvedToday
 *   - missingToday
 *   - devicesOnline
 *   - devicesOffline
 *
 * Permissão (OR): hr.punch-approvals.access OU hr.punch-approvals.admin.
 *
 * Scope: gestor não-admin vê counts dos employees gerenciados (BFS recursivo
 * + delegação) + ele próprio. Admin vê tenant inteiro. Devices NÃO são
 * scoped por employee — visibilidade tenant-wide para todo o time HR.
 */
export async function v1GetDashboardSummaryController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch/dashboard/summary',
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
      summary: 'Contadores agregados do dashboard (5 cards)',
      response: {
        200: summaryResponseSchema,
      },
      security: [{ bearerAuth: [] }],
    },
    handler: async (request, reply) => {
      const tenantId = request.user.tenantId!;

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
            pendingApprovals: 0,
            approvedToday: 0,
            missingToday: 0,
            devicesOnline: 0,
            devicesOffline: 0,
          });
        }
        const managed = await resolveManagedEmployees(myEmployee.id, tenantId);
        scopedEmployeeIds = Array.from(new Set([...managed, myEmployee.id]));
      }

      const useCase = makeGetPunchDashboardSummaryUseCase();
      const result = await useCase.execute({ tenantId, scopedEmployeeIds });
      return reply.status(200).send(result);
    },
  });
}

/** Alias com nome estável esperado pelo aggregator. */
export const punchDashboardSummaryRoutes = v1GetDashboardSummaryController;
