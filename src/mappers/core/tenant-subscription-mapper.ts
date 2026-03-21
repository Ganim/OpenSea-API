import { TenantSubscription } from '@/entities/core/tenant-subscription';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantSubscription as PrismaTenantSubscription } from '@prisma/generated/client';

export interface TenantSubscriptionDTO {
  id: string;
  tenantId: string;
  skillCode: string;
  status: string;
  quantity: number;
  startsAt: Date;
  expiresAt: Date | null;
  cancelledAt: Date | null;
  customPrice: number | null;
  discountPercent: number | null;
  notes: string | null;
  grantedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export function tenantSubscriptionPrismaToDomain(
  raw: PrismaTenantSubscription,
): TenantSubscription {
  return TenantSubscription.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: raw.tenantId,
      skillCode: raw.skillCode,
      status: raw.status,
      quantity: raw.quantity,
      startsAt: raw.startsAt,
      expiresAt: raw.expiresAt,
      cancelledAt: raw.cancelledAt,
      customPrice: raw.customPrice ? Number(raw.customPrice) : null,
      discountPercent: raw.discountPercent ? Number(raw.discountPercent) : null,
      notes: raw.notes,
      grantedBy: raw.grantedBy,
      metadata: raw.metadata as Record<string, unknown>,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function tenantSubscriptionToDTO(
  subscription: TenantSubscription,
): TenantSubscriptionDTO {
  return {
    id: subscription.tenantSubscriptionId.toString(),
    tenantId: subscription.tenantId,
    skillCode: subscription.skillCode,
    status: subscription.status,
    quantity: subscription.quantity,
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    cancelledAt: subscription.cancelledAt,
    customPrice: subscription.customPrice,
    discountPercent: subscription.discountPercent,
    notes: subscription.notes,
    grantedBy: subscription.grantedBy,
    metadata: subscription.metadata,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt ?? subscription.createdAt,
  };
}

export function tenantSubscriptionToPrisma(subscription: TenantSubscription) {
  return {
    id: subscription.tenantSubscriptionId.toString(),
    tenantId: subscription.tenantId,
    skillCode: subscription.skillCode,
    status: subscription.status as PrismaTenantSubscription['status'],
    quantity: subscription.quantity,
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    cancelledAt: subscription.cancelledAt,
    customPrice: subscription.customPrice,
    discountPercent: subscription.discountPercent,
    notes: subscription.notes,
    grantedBy: subscription.grantedBy,
    metadata: subscription.metadata,
  };
}
