import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Contact } from '@/entities/sales/contact';
import { ContactRole } from '@/entities/sales/value-objects/contact-role';
import { LifecycleStage } from '@/entities/sales/value-objects/lifecycle-stage';
import type { Contact as PrismaContact } from '@prisma/generated/client';

export function contactPrismaToDomain(raw: PrismaContact): Contact {
  return Contact.create(
    {
      tenantId: new UniqueEntityID(raw.tenantId),
      customerId: new UniqueEntityID(raw.customerId),
      firstName: raw.firstName,
      lastName: raw.lastName ?? undefined,
      email: raw.email ?? undefined,
      phone: raw.phone ?? undefined,
      whatsapp: raw.whatsapp ?? undefined,
      role: ContactRole.create(raw.role),
      jobTitle: raw.jobTitle ?? undefined,
      department: raw.department ?? undefined,
      lifecycleStage: LifecycleStage.create(raw.lifecycleStage),
      leadScore: raw.leadScore,
      leadTemperature: raw.leadTemperature ?? undefined,
      source: raw.source,
      lastInteractionAt: raw.lastInteractionAt ?? undefined,
      lastChannelUsed: raw.lastChannelUsed ?? undefined,
      socialProfiles:
        (raw.socialProfiles as Record<string, unknown>) ?? undefined,
      tags: raw.tags,
      customFields: (raw.customFields as Record<string, unknown>) ?? undefined,
      avatarUrl: raw.avatarUrl ?? undefined,
      assignedToUserId: raw.assignedToUserId
        ? new UniqueEntityID(raw.assignedToUserId)
        : undefined,
      isMainContact: raw.isMainContact,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt ?? undefined,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}
