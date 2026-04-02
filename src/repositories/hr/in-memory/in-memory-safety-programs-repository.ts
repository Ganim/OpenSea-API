import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SafetyProgram } from '@/entities/hr/safety-program';
import type {
  CreateSafetyProgramSchema,
  FindSafetyProgramFilters,
  SafetyProgramsRepository,
  UpdateSafetyProgramSchema,
} from '../safety-programs-repository';

export class InMemorySafetyProgramsRepository
  implements SafetyProgramsRepository
{
  private items: SafetyProgram[] = [];

  async create(data: CreateSafetyProgramSchema): Promise<SafetyProgram> {
    const id = new UniqueEntityID();
    const safetyProgram = SafetyProgram.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        type: data.type as SafetyProgram['type'],
        name: data.name,
        validFrom: data.validFrom,
        validUntil: data.validUntil,
        responsibleName: data.responsibleName,
        responsibleRegistration: data.responsibleRegistration,
        documentUrl: data.documentUrl,
        status: (data.status as SafetyProgram['status']) ?? 'ACTIVE',
        notes: data.notes,
      },
      id,
    );

    this.items.push(safetyProgram);
    return safetyProgram;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<SafetyProgram | null> {
    const safetyProgram = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return safetyProgram || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindSafetyProgramFilters,
  ): Promise<SafetyProgram[]> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.type) {
      filteredItems = filteredItems.filter(
        (item) => item.type === filters.type,
      );
    }

    if (filters?.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status === filters.status,
      );
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return filteredItems.slice(start, start + perPage);
  }

  async update(data: UpdateSafetyProgramSchema): Promise<SafetyProgram | null> {
    const index = this.items.findIndex((item) => item.id.equals(data.id));

    if (index === -1) return null;

    const existing = this.items[index];

    const updatedProgram = SafetyProgram.create(
      {
        tenantId: existing.tenantId,
        type: (data.type as SafetyProgram['type']) ?? existing.type,
        name: data.name ?? existing.name,
        validFrom: data.validFrom ?? existing.validFrom,
        validUntil: data.validUntil ?? existing.validUntil,
        responsibleName: data.responsibleName ?? existing.responsibleName,
        responsibleRegistration:
          data.responsibleRegistration ?? existing.responsibleRegistration,
        documentUrl: data.documentUrl ?? existing.documentUrl,
        status: (data.status as SafetyProgram['status']) ?? existing.status,
        notes: data.notes ?? existing.notes,
        createdAt: existing.createdAt,
      },
      existing.id,
    );

    this.items[index] = updatedProgram;
    return updatedProgram;
  }

  async delete(id: UniqueEntityID): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(id));
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  clear(): void {
    this.items = [];
  }
}
