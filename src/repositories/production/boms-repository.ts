import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionBomStatus } from '@/entities/production/bill-of-materials';
import { ProductionBom } from '@/entities/production/bill-of-materials';

export interface CreateBomSchema {
  tenantId: string;
  productId: string;
  version: number;
  name: string;
  description?: string;
  isDefault?: boolean;
  validFrom: Date;
  validUntil?: Date;
  status?: ProductionBomStatus;
  baseQuantity: number;
  createdById: string;
  approvedById?: string;
  approvedAt?: Date;
}

export interface UpdateBomSchema {
  id: UniqueEntityID;
  productId?: string;
  version?: number;
  name?: string;
  description?: string | null;
  isDefault?: boolean;
  validFrom?: Date;
  validUntil?: Date | null;
  status?: ProductionBomStatus;
  baseQuantity?: number;
  approvedById?: string | null;
  approvedAt?: Date | null;
}

export interface BomsRepository {
  create(data: CreateBomSchema): Promise<ProductionBom>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionBom | null>;
  findMany(tenantId: string): Promise<ProductionBom[]>;
  findByProductId(
    productId: string,
    tenantId: string,
  ): Promise<ProductionBom[]>;
  findDefaultByProductId(
    productId: string,
    tenantId: string,
  ): Promise<ProductionBom | null>;
  update(data: UpdateBomSchema): Promise<ProductionBom | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
