import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  StoreCredit,
  type StoreCreditSource,
} from '@/entities/sales/store-credit';

interface MakeStoreCreditProps {
  tenantId?: UniqueEntityID;
  customerId?: UniqueEntityID;
  amount?: number;
  balance?: number;
  source?: StoreCreditSource;
  sourceId?: string;
  expiresAt?: Date;
  isActive?: boolean;
}

export function makeStoreCredit(
  override: MakeStoreCreditProps = {},
): StoreCredit {
  return StoreCredit.create(
    {
      tenantId: override.tenantId ?? new UniqueEntityID('tenant-1'),
      customerId: override.customerId ?? new UniqueEntityID(),
      amount: override.amount ?? 100,
      balance: override.balance,
      source: override.source ?? 'MANUAL',
      sourceId: override.sourceId,
      expiresAt: override.expiresAt,
      isActive: override.isActive,
    },
    new UniqueEntityID(),
  );
}
