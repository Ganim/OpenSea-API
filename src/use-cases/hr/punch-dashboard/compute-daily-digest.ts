/**
 * ComputeDailyDigestUseCase — Phase 07 / Plan 07-05a (Wave 2).
 *
 * Consolida contadores do tenant no final do dia (18h timezone-tenant) e
 * dispatcha a notification `punch.daily_digest` (INFORMATIONAL) para:
 *   - Admins do módulo HR (`hr.punch-approvals.admin`) — com canais
 *     IN_APP + EMAIL (carga de trabalho diária).
 *   - Managers (users referenciados em `Employee.supervisorId` de pelo menos
 *     um subordinado) — apenas canal IN_APP (mais volumoso, menor critério
 *     de ação imediata).
 *
 * **Idempotência:** `idempotencyKey = punch.daily_digest:{tenantId}:{date}:{userId}`
 * (dispatcher dedupa). Execuções repetidas do scheduler são safe.
 *
 * **Use case é PURO:** depende apenas do PrismaClient (via shape mínimo) +
 * notificationClient. Eventos são responsabilidade do scheduler (opcional
 * `PUNCH_EVENTS.DAILY_DIGEST_SENT` — não implementado aqui para preservar
 * pureza; scheduler pode emitir se quiser).
 */
import type { DispatchNotificationInput } from '@/modules/notifications/public/events';
import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
} from '@/modules/notifications/public/types';

/**
 * Shape mínimo do `PrismaClient` consumido — mantém o use case testável sem
 * iniciar o client real.
 */
export interface DailyDigestPrisma {
  punchApproval: {
    count(args: { where: Record<string, unknown> }): Promise<number>;
  };
  punchMissedLog: {
    count(args: { where: Record<string, unknown> }): Promise<number>;
  };
  permissionGroup: {
    findMany(args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }): Promise<Array<{ users: Array<{ userId: string | null }> }>>;
  };
  employee: {
    findMany(args: {
      where: Record<string, unknown>;
      select: Record<string, unknown>;
    }): Promise<Array<{ supervisorId: string | null; userId: string | null }>>;
  };
}

/**
 * Shape mínimo do NotificationClient usado.
 */
export interface DailyDigestNotificationClient {
  dispatch(
    input: DispatchNotificationInput,
  ): Promise<{ notificationIds: string[] }>;
}

export interface ComputeDailyDigestInput {
  tenantId: string;
  date: Date;
  /** BullMQ jobId opcional para trace. */
  jobId?: string;
}

export interface ComputeDailyDigestResult {
  pendingCount: number;
  approvedCount: number;
  missingCount: number;
  dispatchedCount: number;
  /** userIds que receberam o digest. */
  recipientUserIds: string[];
  adminCount: number;
  managerCount: number;
}

function toUtcStartOfDay(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function toIsoDateKey(date: Date): string {
  // YYYY-MM-DD em UTC.
  return date.toISOString().slice(0, 10);
}

export class ComputeDailyDigestUseCase {
  constructor(
    private prisma: DailyDigestPrisma,
    private notificationClient: DailyDigestNotificationClient,
  ) {}

  async execute(
    input: ComputeDailyDigestInput,
  ): Promise<ComputeDailyDigestResult> {
    const { tenantId, date } = input;
    const dateKey = toUtcStartOfDay(date);
    const dateStr = toIsoDateKey(dateKey);

    const [pendingCount, approvedCount, missingCount] = await Promise.all([
      this.prisma.punchApproval.count({
        where: { tenantId, status: 'PENDING' },
      }),
      this.prisma.punchApproval.count({
        where: {
          tenantId,
          status: 'APPROVED',
          resolvedAt: { gte: dateKey },
        },
      }),
      this.prisma.punchMissedLog.count({
        where: { tenantId, date: dateKey, resolvedAt: null },
      }),
    ]);

    const [adminUserIds, managerUserIds] = await Promise.all([
      this.findAdminUserIds(tenantId),
      this.findManagerUserIds(tenantId),
    ]);

    const adminSet = new Set(adminUserIds);
    const managerSet = new Set(managerUserIds);
    // Admins recebem; managers que também são admins não duplicam.
    const allRecipients = Array.from(new Set([...adminSet, ...managerSet]));

    const dispatched: string[] = [];

    for (const userId of allRecipients) {
      const isAdmin = adminSet.has(userId);
      const channels: NotificationChannel[] = isAdmin
        ? [NotificationChannel.IN_APP, NotificationChannel.EMAIL]
        : [NotificationChannel.IN_APP];

      try {
        await this.notificationClient.dispatch({
          type: NotificationType.INFORMATIONAL,
          category: 'punch.daily_digest',
          tenantId,
          recipients: { userIds: [userId] },
          title: `Resumo do ponto — ${dateStr}`,
          body: `Você tem ${pendingCount} exceções pendentes, ${approvedCount} aprovadas hoje e ${missingCount} faltantes.`,
          priority: NotificationPriority.NORMAL,
          channels,
          entity: { type: 'punch_dashboard', id: tenantId },
          metadata: {
            pending: pendingCount,
            approved: approvedCount,
            missing: missingCount,
            link: '/hr/punch/dashboard',
          },
          idempotencyKey: `punch.daily_digest:${tenantId}:${dateStr}:${userId}`,
        });
        dispatched.push(userId);
      } catch {
        // At-least-once: continua para os próximos — melhor 9 de 10 digestos
        // dispatched que 0 por um recipient falho.
      }
    }

    return {
      pendingCount,
      approvedCount,
      missingCount,
      dispatchedCount: dispatched.length,
      recipientUserIds: dispatched,
      adminCount: adminSet.size,
      managerCount: managerSet.size,
    };
  }

  private async findAdminUserIds(tenantId: string): Promise<string[]> {
    const groups = await this.prisma.permissionGroup.findMany({
      where: {
        OR: [{ tenantId }, { tenantId: null }],
        deletedAt: null,
        isActive: true,
        permissions: {
          some: { permission: { code: 'hr.punch-approvals.admin' } },
        },
      },
      select: { users: { select: { userId: true } } },
    });
    const ids = new Set<string>();
    for (const g of groups) {
      for (const u of g.users) {
        if (u.userId) ids.add(u.userId);
      }
    }
    return Array.from(ids);
  }

  private async findManagerUserIds(tenantId: string): Promise<string[]> {
    // Managers = supervisorIds distintos dos Employees ativos do tenant,
    // resolvidos para o userId do próprio manager.
    const employees = await this.prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        supervisorId: { not: null },
      },
      select: { supervisorId: true, userId: true },
    });
    const managerEmployeeIds = new Set<string>();
    for (const e of employees) {
      if (e.supervisorId) managerEmployeeIds.add(e.supervisorId);
    }
    if (managerEmployeeIds.size === 0) return [];

    const managers = await this.prisma.employee.findMany({
      where: {
        tenantId,
        deletedAt: null,
        id: { in: Array.from(managerEmployeeIds) },
      },
      select: { supervisorId: true, userId: true },
    });
    const ids = new Set<string>();
    for (const m of managers) {
      if (m.userId) ids.add(m.userId);
    }
    return Array.from(ids);
  }
}
