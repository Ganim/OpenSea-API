import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UniqueEntityID as EntityID } from '@/entities/domain/unique-entity-id';
import type { ProductionDefectTypeSeverity } from '@/entities/production/defect-type';
import { ProductionDefectType } from '@/entities/production/defect-type';
import type {
  DefectTypesRepository,
  CreateDefectTypeSchema,
  UpdateDefectTypeSchema,
} from '../defect-types-repository';

export class InMemoryDefectTypesRepository implements DefectTypesRepository {
  public items: ProductionDefectType[] = [];

  async create(data: CreateDefectTypeSchema): Promise<ProductionDefectType> {
    const defectType = ProductionDefectType.create({
      tenantId: new EntityID(data.tenantId),
      code: data.code,
      name: data.name,
      description: data.description ?? null,
      severity: data.severity as ProductionDefectTypeSeverity,
      isActive: data.isActive ?? true,
    });

    this.items.push(defectType);
    return defectType;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<ProductionDefectType | null> {
    const item = this.items.find(
      (i) => i.id.equals(id) && i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findByCode(
    code: string,
    tenantId: string,
  ): Promise<ProductionDefectType | null> {
    const item = this.items.find(
      (i) =>
        i.code.toLowerCase() === code.toLowerCase() &&
        i.tenantId.toString() === tenantId,
    );
    return item ?? null;
  }

  async findMany(tenantId: string): Promise<ProductionDefectType[]> {
    return this.items.filter((i) => i.tenantId.toString() === tenantId);
  }

  async update(
    data: UpdateDefectTypeSchema,
  ): Promise<ProductionDefectType | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.code !== undefined) item.code = data.code;
    if (data.name !== undefined) item.name = data.name;
    if (data.description !== undefined) item.description = data.description;
    if (data.severity !== undefined) item.severity = data.severity;
    if (data.isActive !== undefined) item.isActive = data.isActive;

    return item;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((i) => i.id.equals(id));
    if (index >= 0) {
      this.items.splice(index, 1);
    }
  }
}
