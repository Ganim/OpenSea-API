import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';
import { PrismaEmployeesRepository } from '@/repositories/hr/prisma/prisma-employees-repository';
import { PrismaTrainingEnrollmentsRepository } from '@/repositories/hr/prisma/prisma-training-enrollments-repository';
import { PrismaTrainingProgramsRepository } from '@/repositories/hr/prisma/prisma-training-programs-repository';
import { makeCreateNotificationUseCase } from '@/use-cases/notifications/factories/make-create-notification-use-case';

/**
 * HR P0 — Training certificate retraining reminder.
 *
 * Runs daily. Two passes:
 *
 *  1. "Expires within 30 days"   -> notifies the employee + manager with a
 *     heads-up ("seu certificado de NR-35 vence em X dias").
 *  2. "Already expired since yesterday" -> sends the "re-inscrição
 *     necessária" alert to both the employee and the manager so someone
 *     picks up re-enrollment. We explicitly do NOT auto-create a new
 *     enrollment — retraining is a management decision, not an automated
 *     write.
 *
 * Approved in the task brief: "cron only sends re-inscrição necessária
 * notification to employee + manager". Auto-creation is deferred.
 */

const LOG_PREFIX = '[check-training-expiry]';
const DEFAULT_LOOKAHEAD_DAYS = 30;

export interface CheckTrainingExpiryResult {
  upcomingNotified: number;
  expiredNotified: number;
}

/**
 * Single-shot execution. Callers (scheduler.tick, standalone script) invoke
 * this and log the result. Errors are caught by the caller — this function
 * lets exceptions propagate so observability can alert on scheduler failure.
 */
export async function checkTrainingExpiry(options?: {
  referenceDate?: Date;
  lookaheadDays?: number;
  /**
   * Cursor for "expired since". When omitted we default to 24h ago so the
   * daily schedule catches overnight expirations without re-notifying
   * multi-day-old expirations.
   */
  expiredSince?: Date;
}): Promise<CheckTrainingExpiryResult> {
  const referenceDate = options?.referenceDate ?? new Date();
  const lookaheadDays = options?.lookaheadDays ?? DEFAULT_LOOKAHEAD_DAYS;
  const expiredSince =
    options?.expiredSince ??
    new Date(referenceDate.getTime() - 24 * 60 * 60 * 1000);

  const trainingEnrollmentsRepository =
    new PrismaTrainingEnrollmentsRepository();
  const trainingProgramsRepository = new PrismaTrainingProgramsRepository();
  const employeesRepository = new PrismaEmployeesRepository();
  const createNotificationUseCase = makeCreateNotificationUseCase();

  logger.info(
    { referenceDate, lookaheadDays, expiredSince },
    `${LOG_PREFIX} starting`,
  );

  const upcoming =
    await trainingEnrollmentsRepository.findExpiringWithin(lookaheadDays);
  const expired =
    await trainingEnrollmentsRepository.findExpiredSince(expiredSince);

  let upcomingNotified = 0;
  let expiredNotified = 0;

  for (const enrollment of upcoming) {
    const program = await trainingProgramsRepository.findById(
      enrollment.trainingProgramId,
      enrollment.tenantId.toString(),
    );
    if (!program) continue;

    const targetUsers = await resolveTargetUsers(
      employeesRepository,
      enrollment.employeeId,
      enrollment.tenantId.toString(),
    );

    if (targetUsers.length > 0) {
      const { notificationClient, NotificationType, NotificationPriority } =
        await import('@/modules/notifications/public');
      await notificationClient.dispatch({
        type: NotificationType.LINK,
        category: 'hr.training_expiring',
        tenantId: enrollment.tenantId.toString(),
        recipients: { userIds: targetUsers },
        priority: NotificationPriority.HIGH,
        title: 'Treinamento próximo do vencimento',
        body: `A certificação de "${program.name}" vence em ${enrollment.expirationDate!.toLocaleDateString('pt-BR')}.`,
        actionUrl: `/hr/trainings/${enrollment.id.toString()}`,
        actionText: 'Planejar re-inscrição',
        entity: { type: 'training_enrollment', id: enrollment.id.toString() },
        idempotencyKey: `hr.training_expiring:${enrollment.id.toString()}:${enrollment.expirationDate?.toISOString().slice(0, 10)}`,
      });
      upcomingNotified += targetUsers.length;
    }
  }

  for (const enrollment of expired) {
    const program = await trainingProgramsRepository.findById(
      enrollment.trainingProgramId,
      enrollment.tenantId.toString(),
    );
    if (!program) continue;

    const targetUsers = await resolveTargetUsers(
      employeesRepository,
      enrollment.employeeId,
      enrollment.tenantId.toString(),
    );

    if (targetUsers.length > 0) {
      const { notificationClient, NotificationType, NotificationPriority } =
        await import('@/modules/notifications/public');
      await notificationClient.dispatch({
        type: NotificationType.LINK,
        category: 'hr.training_expired',
        tenantId: enrollment.tenantId.toString(),
        recipients: { userIds: targetUsers },
        priority: NotificationPriority.URGENT,
        title: 'Re-inscrição necessária',
        body: `A certificação de "${program.name}" expirou em ${enrollment.expirationDate!.toLocaleDateString('pt-BR')}. É necessário realizar uma nova inscrição.`,
        actionUrl: `/hr/trainings/${enrollment.id.toString()}`,
        actionText: 'Ver detalhes',
        entity: { type: 'training_enrollment', id: enrollment.id.toString() },
        idempotencyKey: `hr.training_expired:${enrollment.id.toString()}:${enrollment.expirationDate?.toISOString().slice(0, 10)}`,
      });
      expiredNotified += targetUsers.length;
    }
  }

  logger.info({ upcomingNotified, expiredNotified }, `${LOG_PREFIX} finished`);

  return { upcomingNotified, expiredNotified };
}

/**
 * Returns the set of user IDs that should receive the notification for a
 * given employee — the employee (so they know personally) plus their
 * manager/supervisor (so management can act). Skips silently when the
 * employee has no linked user.
 */
async function resolveTargetUsers(
  employeesRepository: PrismaEmployeesRepository,
  employeeId: UniqueEntityID,
  tenantId: string,
): Promise<string[]> {
  const employee = await employeesRepository.findById(employeeId, tenantId);
  if (!employee) return [];

  const targets = new Set<string>();

  if (employee.userId) {
    targets.add(employee.userId.toString());
  }

  if (employee.supervisorId) {
    const supervisor = await employeesRepository.findById(
      employee.supervisorId,
      tenantId,
    );
    if (supervisor?.userId) {
      targets.add(supervisor.userId.toString());
    }
  }

  return Array.from(targets);
}

// Referenced so `prisma` import doesn't get pruned by tree-shaking when a
// future tenant-loop variant is added. Safe to inline-remove later.
void prisma;
