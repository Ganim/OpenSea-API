import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDowntimeReasonCategory } from '@/entities/production/downtime-reason';
import { ProductionDowntimeReason } from '@/entities/production/downtime-reason';

export interface CreateDowntimeReasonSchema {
  tenantId: string;
  code: string;
  name: string;
  category: ProductionDowntimeReasonCategory;
  isActive?: boolean;
}

export interface UpdateDowntimeReasonSchema {
  id: UniqueEntityID;
  code?: string;
  name?: string;
  category?: ProductionDowntimeReasonCategory;
  isActive?: boolean;
}

export interface DowntimeReasonsRepository {
  create(data: CreateDowntimeReasonSchema): Promise<ProductionDowntimeReason>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionDowntimeReason | null>;
  findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionDowntimeReason | null>;
  findMany(tenantId: string): Promise<ProductionDowntimeReason[]>;
  update(
    data: UpdateDowntimeReasonSchema,
  ): Promise<ProductionDowntimeReason | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
