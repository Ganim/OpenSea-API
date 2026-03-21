import { TenantConsumption } from '@/entities/core/tenant-consumption';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantConsumption as PrismaTenantConsumption } from '@prisma/generated/client';

export interface TenantConsumptionDTO {
  id: string;
  tenantId: string;
  period: string;
  metric: string;
  quantity: number;
  limit: number | null;
  used: number;
  included: number;
  overage: number;
  overageCost: number;
  createdAt: Date;
  updatedAt: Date;
}

export function tenantConsumptionPrismaToDomain(
  raw: PrismaTenantConsumption,
): TenantConsumption {
  return TenantConsumption.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: raw.tenantId,
      period: raw.period,
      metric: raw.metric,
      quantity: raw.quantity,
      limit: raw.limit,
      used: raw.used,
      included: raw.included,
      overage: raw.overage,
      overageCost: Number(raw.overageCost),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function tenantConsumptionToDTO(
  consumption: TenantConsumption,
): TenantConsumptionDTO {
  return {
    id: consumption.tenantConsumptionId.toString(),
    tenantId: consumption.tenantId,
    period: consumption.period,
    metric: consumption.metric,
    quantity: consumption.quantity,
    limit: consumption.limit,
    used: consumption.used,
    included: consumption.included,
    overage: consumption.overage,
    overageCost: consumption.overageCost,
    createdAt: consumption.createdAt,
    updatedAt: consumption.updatedAt ?? consumption.createdAt,
  };
}

export function tenantConsumptionToPrisma(consumption: TenantConsumption) {
  return {
    id: consumption.tenantConsumptionId.toString(),
    tenantId: consumption.tenantId,
    period: consumption.period,
    metric: consumption.metric,
    quantity: consumption.quantity,
    limit: consumption.limit,
    used: consumption.used,
    included: consumption.included,
    overage: consumption.overage,
    overageCost: consumption.overageCost,
  };
}
