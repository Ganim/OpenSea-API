import type { Server as SocketIOServer, Socket } from 'socket.io';

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { getPermissionService } from '@/services/rbac/get-permission-service';

/**
 * HR Socket.IO scope helpers — Phase 7 / Plan 07-02
 *
 * Corrige o bug silencioso onde workers emitiam em `tenant:{id}:hr`
 * mas nenhum socket estava joined nesse room. Plan 7 introduz auto-join
 * baseado em permissões RBAC e expõe helper `emitToEligibleManagers`
 * para filtro server-side per-manager (evita multiplicação de rooms
 * no Redis Adapter — ver D-07 + memory Redis quota 2026-04-22).
 */

/**
 * Lista todos os códigos de permissão (effect=allow) de um usuário.
 *
 * Adapter sobre `PermissionService.getUserPermissionCodes` (que recebe
 * `UniqueEntityID`). O nome `listCodesForUser` preserva a semântica
 * declarada no plan — o tenantId não é usado pelo service atual
 * (UserPermissionGroups já são scoped por grupo + tenant internamente),
 * mas mantemos o parâmetro para assinatura estável.
 */
async function listCodesForUser(
  userId: string,
  _tenantId: string,
): Promise<string[]> {
  const service = getPermissionService();
  return service.getUserPermissionCodes(new UniqueEntityID(userId));
}

/**
 * Faz o socket entrar nos rooms HR conforme as permissões do usuário.
 *
 * - `tenant:{tenantId}:hr`      — qualquer permissão `hr.*`
 * - `tenant:{tenantId}:hr:admin` — permissão `hr.punch-approvals.admin`
 *
 * Fail-closed: qualquer erro na lookup RBAC é logado e swallow — o socket
 * permanece conectado, mas sem HR rooms (usuário não recebe eventos HR
 * até reconectar). Preferível a abrir broadcast sem check.
 */
export async function joinHrRoomsForUser(
  socket: Pick<Socket, 'join'>,
  userId: string,
  tenantId: string,
): Promise<void> {
  try {
    const codes = await listCodesForUser(userId, tenantId);
    if (codes.some((c) => c.startsWith('hr.'))) {
      socket.join(`tenant:${tenantId}:hr`);
    }
    if (codes.includes('hr.punch-approvals.admin')) {
      socket.join(`tenant:${tenantId}:hr:admin`);
    }
  } catch (err) {
    logger.warn(
      { err, userId, tenantId },
      '[hr-socket-scope] failed to join HR rooms',
    );
  }
}

/**
 * Resolve os userIds elegíveis a receber eventos scoped de um funcionário
 * (D-07 — hierarquia gerencial + delegação + admin HR tenant-wide).
 *
 * Coleta:
 * 1. **Cadeia de supervisores** (BFS up) via `Employee.supervisorId` —
 *    todos os níveis acima até raiz ou MAX_DEPTH=20 (cycle guard).
 * 2. **Delegados ativos** (`ApprovalDelegation` com `delegatorId` = manager
 *    na cadeia, `isActive=true`, `startDate <= now`, `endDate IS NULL OR >= now`).
 * 3. **Admins HR do tenant** — users em `PermissionGroup` que concede
 *    `hr.punch-approvals.admin`.
 *
 * Dedupe via `Set`. Retorna array de userIds (strings).
 */
export async function resolveEligibleManagerUserIds(
  tenantId: string,
  employeeId: string,
): Promise<string[]> {
  const employee = (await prisma.employee.findFirst({
    where: { id: employeeId, tenantId, deletedAt: null },
    select: { id: true, supervisorId: true, userId: true },
  })) as {
    id: string;
    supervisorId: string | null;
    userId: string | null;
  } | null;
  if (!employee) return [];

  const ids = new Set<string>();
  const now = new Date();

  // 1. BFS recursive manager chain (D-07): walk employee.supervisorId up to root.
  //    Each level adds the manager's userId + delegatees of active ApprovalDelegation.
  //    Example: E reports to M1; M1 reports to M2 (CEO). Both are eligible.
  //    If M1 has active delegation to D, D is also eligible while delegation active.
  const visited = new Set<string>();
  let currentEmployeeId: string | null = employee.supervisorId ?? null;
  const MAX_DEPTH = 20; // safety cap against cycles / absurd org depth
  let depth = 0;

  while (currentEmployeeId && depth < MAX_DEPTH) {
    if (visited.has(currentEmployeeId)) break; // cycle guard
    visited.add(currentEmployeeId);
    depth++;

    const manager = (await prisma.employee.findFirst({
      where: { id: currentEmployeeId, tenantId, deletedAt: null },
      select: { id: true, userId: true, supervisorId: true },
    })) as {
      id: string;
      userId: string | null;
      supervisorId: string | null;
    } | null;
    if (!manager) break;
    if (manager.userId) ids.add(manager.userId);

    // Expand ApprovalDelegation active for this manager.
    // Schema: approval_delegations (delegatorId, delegateId, isActive, startDate, endDate).
    const delegations = (await prisma.approvalDelegation.findMany({
      where: {
        tenantId,
        delegatorId: manager.id,
        isActive: true,
        startDate: { lte: now },
        OR: [{ endDate: null }, { endDate: { gte: now } }],
      },
      select: { delegateId: true },
    })) as { delegateId: string }[];

    const delegateIds = delegations
      .map((d) => d.delegateId)
      .filter((x): x is string => Boolean(x));
    if (delegateIds.length > 0) {
      const delegates = (await prisma.employee.findMany({
        where: { id: { in: delegateIds }, tenantId, deletedAt: null },
        select: { userId: true },
      })) as { userId: string | null }[];
      for (const d of delegates) if (d.userId) ids.add(d.userId);
    }

    currentEmployeeId = manager.supervisorId ?? null; // ascend
  }

  // 2. Admin HR users of the tenant (users in groups granting hr.punch-approvals.admin).
  //    PermissionGroup.tenantId is nullable (global templates); we scope to tenant
  //    OR null to include system/global admin groups seeded by the backfill.
  const adminGroups = (await prisma.permissionGroup.findMany({
    where: {
      OR: [{ tenantId }, { tenantId: null }],
      deletedAt: null,
      isActive: true,
      permissions: {
        some: { permission: { code: 'hr.punch-approvals.admin' } },
      },
    },
    select: { users: { select: { userId: true } } },
  })) as { users: { userId: string | null }[] }[];

  for (const g of adminGroups) {
    for (const u of g.users) {
      if (u.userId) ids.add(u.userId);
    }
  }

  return Array.from(ids);
}

/**
 * Emite `event` com `payload` para cada userId elegível como gestor
 * do funcionário (ver `resolveEligibleManagerUserIds`).
 *
 * Usa o room `user:{userId}` (já joined por qualquer browser socket
 * autenticado) — NÃO chama `io.to('tenant:{id}:hr')` para não gerar
 * broadcast intra-tenant desrespeitando escopo hierárquico (D-07).
 */
export async function emitToEligibleManagers(
  io: Pick<SocketIOServer, 'to'>,
  tenantId: string,
  employeeId: string,
  event: string,
  payload: unknown,
): Promise<void> {
  const userIds = await resolveEligibleManagerUserIds(tenantId, employeeId);
  for (const userId of userIds) {
    io.to(`user:${userId}`).emit(event, payload);
  }
}
