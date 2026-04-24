import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PermissionCodes } from '@/constants/rbac';
import { createAnyPermissionMiddleware } from '@/http/middlewares/rbac/verify-permission';
import { verifyJwt } from '@/http/middlewares/rbac/verify-jwt';
import { verifyTenant } from '@/http/middlewares/rbac/verify-tenant';
import {
  getHeatmapQuerySchema,
  heatmapResponseSchema,
} from '@/http/schemas/hr/punch/punch-dashboard.schema';
import { prisma } from '@/lib/prisma';
import { getPermissionService } from '@/services/rbac/get-permission-service';
import { makeGetPunchHeatmapUseCase } from '@/use-cases/hr/punch-dashboard/factories/make-get-punch-heatmap';

/**
 * GET /v1/hr/punch/dashboard/heatmap?month=YYYY-MM&employeeIds=...
 *
 * Heatmap funcionário×dia×status6 do dashboard do gestor.
 *
 * Permissão (OR): hr.punch-approvals.access OU hr.punch-approvals.admin.
 *
 * Scope widening (D-07):
 *   - Caller com `hr.punch-approvals.admin` → vê tenant inteiro (employeeIds
 *     opcional para filtrar dentro disso).
 *   - Caller com apenas `.access` → restrito aos employees gerenciados via
 *     `resolveManagedEmployees` BFS recursivo (Employee.supervisorId +
 *     ApprovalDelegation ativa) + o próprio employee mapeado ao userId.
 *   - Caller sem Employee → 200 com rows/cells vazios (não vaza dados de
 *     outros).
 */
export async function v1GetPunchHeatmapController(app: FastifyInstance) {
  app.withTypeProvider<ZodTypeProvider>().route({
    method: 'GET',
    url: '/v1/hr/punch/dashboard/heatmap',
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
      summary: 'Heatmap funcionário×dia×status do mês',
      description:
        'Retorna { rows, columns, cells } com 6 statuses (NORMAL, ATRASO, FALTA, EXCEÇÃO, JUSTIFICADO, HORA_EXTRA). Scope hierárquico recursivo D-07.',
      querystring: getHeatmapQuerySchema,
      response: {
        200: heatmapResponseSchema,
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

      let effectiveEmployeeIds: string[] | undefined;

      if (!isAdmin) {
        const myEmployee = await prisma.employee.findFirst({
          where: { userId: request.user.sub, tenantId, deletedAt: null },
          select: { id: true },
        });
        if (!myEmployee) {
          return reply.status(200).send({ rows: [], columns: [], cells: [] });
        }
        const managed = await resolveManagedEmployees(myEmployee.id, tenantId);
        effectiveEmployeeIds = Array.from(new Set([...managed, myEmployee.id]));
      } else if (query.employeeIds && query.employeeIds.length > 0) {
        effectiveEmployeeIds = query.employeeIds;
      }

      const useCase = makeGetPunchHeatmapUseCase();
      const result = await useCase.execute({
        tenantId,
        month: query.month,
        employeeIds: effectiveEmployeeIds,
      });

      return reply.status(200).send(result);
    },
  });
}

/**
 * D-07: Scope hierárquico RECURSIVO. BFS começando em managerEmployeeId.
 * Inclui:
 *   - Todos subordinados diretos + indiretos (árvore inteira abaixo).
 *   - Subordinados acessíveis via ApprovalDelegation ativa (delegateId =
 *     managerEmployeeId, isActive=true, dentro da janela startDate/endDate).
 *
 * Exemplo: CEO(E-CEO) → Gerente(E-MGR) → Analista(E-ANAL).
 *   Chamada para E-MGR retorna [E-ANAL].
 *   Chamada para E-CEO retorna [E-MGR, E-ANAL].
 *
 * Counterpart de `resolveEligibleManagerUserIds` (Plan 07-02 hr-socket-scope)
 * que faz BFS UP. Este faz BFS DOWN.
 */
export async function resolveManagedEmployees(
  managerEmployeeId: string,
  tenantId: string,
): Promise<string[]> {
  const now = new Date();
  const visited = new Set<string>();
  const result = new Set<string>();
  const queue: string[] = [];

  const MAX_DEPTH_GUARD = 1024;

  // 1. Base: subordinados diretos do próprio manager.
  queue.push(managerEmployeeId);

  // 2. Expand via ApprovalDelegation ativa: se EU sou delegate de outro
  // employee (delegatorId), incluo a árvore DELE também.
  const delegations = (await prisma.approvalDelegation.findMany({
    where: {
      tenantId,
      delegateId: managerEmployeeId,
      isActive: true,
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    },
    select: { delegatorId: true },
  })) as { delegatorId: string | null }[];
  for (const d of delegations) {
    if (d.delegatorId) queue.push(d.delegatorId);
  }

  // 3. BFS DOWN: para cada manager na queue, busca direct reports e os
  // adiciona ao result + queue (próximo nível).
  let iterations = 0;
  while (queue.length > 0 && iterations < MAX_DEPTH_GUARD) {
    iterations++;
    const currentId = queue.shift()!;
    if (visited.has(currentId)) continue;
    visited.add(currentId);

    const directReports = (await prisma.employee.findMany({
      where: {
        supervisorId: currentId,
        tenantId,
        deletedAt: null,
      },
      select: { id: true },
    })) as { id: string }[];

    for (const sub of directReports) {
      if (!visited.has(sub.id)) {
        result.add(sub.id);
        queue.push(sub.id);
      }
    }
  }

  return Array.from(result);
}

/**
 * Alias com nome estável esperado pelo aggregator (`punchDashboardRoutes`).
 * Mantemos `v1GetPunchHeatmapController` como nome canônico do plugin
 * Fastify para coerência com os demais controllers v1-* do projeto.
 */
export const punchDashboardHeatmapRoutes = v1GetPunchHeatmapController;
