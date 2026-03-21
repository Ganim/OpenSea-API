import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Campaign } from '@/entities/sales/campaign';

export function campaignPrismaToDomain(record: {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  discountValue: number | { toNumber(): number };
  applicableTo: string;
  minOrderValue?: number | null;
  maxDiscountAmount?: number | null;
  maxUsageTotal?: number | null;
  maxUsagePerCustomer?: number | null;
  currentUsageTotal: number;
  startDate?: Date | null;
  endDate?: Date | null;
  priority: number;
  isStackable: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}): Campaign {
  return Campaign.create(
    {
      tenantId: new UniqueEntityID(record.tenantId),
      name: record.name,
      description: record.description ?? undefined,
      type: record.type as Campaign['type'],
      status: record.status as Campaign['status'],
      discountValue:
        typeof record.discountValue === 'number'
          ? record.discountValue
          : record.discountValue.toNumber(),
      applicableTo: record.applicableTo as Campaign['applicableTo'],
      minOrderValue: record.minOrderValue ?? undefined,
      maxDiscountAmount: record.maxDiscountAmount ?? undefined,
      maxUsageTotal: record.maxUsageTotal ?? undefined,
      maxUsagePerCustomer: record.maxUsagePerCustomer ?? undefined,
      currentUsageTotal: record.currentUsageTotal,
      startDate: record.startDate ?? undefined,
      endDate: record.endDate ?? undefined,
      priority: record.priority,
      isStackable: record.isStackable,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      deletedAt: record.deletedAt ?? undefined,
    },
    new UniqueEntityID(record.id),
  );
}
