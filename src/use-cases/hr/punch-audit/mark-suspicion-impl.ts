/**
 * Phase 9 / Plan 09-02 — MarkSuspicionUseCase implementation.
 * Creates idempotent PUNCH_AUDIT_MARK_SUSPICION audit logs.
 * Idempotency key: (tenantId, timeEntryId, markedByUserId, action=PUNCH_AUDIT_MARK_SUSPICION)
 */

import { prisma } from '@/lib/prisma';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import type { MarkSuspicionUseCase } from './mark-suspicion';

export class MarkSuspicionUseCaseImpl implements MarkSuspicionUseCase {
  async execute(req: Parameters<MarkSuspicionUseCase['execute']>[0]) {
    const { tenantId, timeEntryId, reason, markedByUserId } = req;

    // Verify TimeEntry exists
    const timeEntry = await prisma.timeEntry.findFirst({
      where: { id: timeEntryId, tenantId },
    });

    if (!timeEntry) {
      throw new ResourceNotFoundError('TimeEntry not found');
    }

    // Check if already marked (idempotency)
    // Idempotency: (entity=timeEntryId, action=UPDATE, markedByUserId, tenantId)
    const existing = await prisma.auditLog.findFirst({
      where: {
        tenantId,
        entityId: timeEntryId,
        action: 'UPDATE', // Using UPDATE as proxy for audit mark
        userId: markedByUserId,
        description: { contains: 'PUNCH_AUDIT_MARK_SUSPICION' },
      },
    });

    if (existing) {
      // Already marked — return the existing log
      return {
        markedAt: existing.createdAt,
        auditLogId: existing.id,
      };
    }

    // Create new audit log
    const auditLog = await prisma.auditLog.create({
      data: {
        tenantId,
        action: 'UPDATE',
        entity: 'TIME_ENTRY',
        module: 'HR',
        entityId: timeEntryId,
        description: 'PUNCH_AUDIT_MARK_SUSPICION',
        newData: {
          timeEntryId,
          reason,
          markedAt: new Date().toISOString(),
        },
        userId: markedByUserId,
      },
    });

    return {
      markedAt: auditLog.createdAt,
      auditLogId: auditLog.id,
    };
  }
}
