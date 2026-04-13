import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionBomStatus } from '@/entities/production/bill-of-materials';
import { ProductionBom } from '@/entities/production/bill-of-materials';
import type {
  BomsRepository,
  CreateBomSchema,
  UpdateBomSchema,
} from '../boms-repository';

export class InMemoryBomsRepository implements BomsRepository {
  public items: ProductionBom[] = [];

  async create(data: CreateBomSchema): Promise<ProductionBom> {
    const bom = ProductionBom.create({
      tenantId: new EntityID(data.tenantId),
      productId: new EntityID(data.productId),
      version: data.version,
      name: data.name,
      description: data.description ?? null,
      isDefault: data.isDefault ?? false,
      validFrom: data.validFrom,
      validUntil: data.validUntil ?? null,
      status: (data.status ?? 'DRAFT') as ProductionBomStatus,
      baseQuantity: data.baseQuantity,
      createdById: new EntityID(data.createdById),
      approvedById: data.approvedById
        ? new EntityID(data.approvedById)
        : null,
      approvedAt: data.approvedAt ?? null,
    });

    this.items.push(bom);
    return bom;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionBom | null> {
    const item = this.items.find(
      (i) =>
        i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionBom[]> {
    return this.items.filter(
      (i) => i.tenantId.toString() === tenantId,
    );
  }

  async findByProductId(
    productId: string,
    tenantId: string,
  ): Promise<ProductionBom[]> {
    return this.items.filter(
      (i) =>
        i.productId.toString() === productId &&
        i.tenantId.toString() === tenantId,
    );
  }

  async findDefaultByProductId(
    productId: string,
    tenantId: string,
  ): Promise<ProductionBom | null> {
    const item = this.items.find(
      (i) =>
        i.productId.toString() === productId &&
        i.tenantId.toString() === tenantId &&
        i.isDefault &&
        i.status === 'ACTIVE',
    );
    return item ?? null;
  }

  async update(data: UpdateBomSchema): Promise<ProductionBom | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.productId !== undefined)
      item.productId = new EntityID(data.productId);
    if (data.version !== undefined) item.version = data.version;
    if (data.name !== undefined) item.name = data.name;
    if (data.description !== undefined) item.description = data.description;
    if (data.isDefault !== undefined) item.isDefault = data.isDefault;
    if (data.validFrom !== undefined) item.validFrom = data.validFrom;
    if (data.validUntil !== undefined) item.validUntil = data.validUntil;
    if (data.status !== undefined) item.status = data.status;
    if (data.baseQuantity !== undefined)
      item.baseQuantity = data.baseQuantity;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
