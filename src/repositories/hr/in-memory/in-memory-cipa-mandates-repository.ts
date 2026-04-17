import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CipaMandate } from '@/entities/hr/cipa-mandate';
import type {
  CipaMandatesRepository,
  CreateCipaMandateSchema,
  FindCipaMandateFilters,
  UpdateCipaMandateSchema,
} from '../cipa-mandates-repository';

export class InMemoryCipaMandatesRepository implements CipaMandatesRepository {
  private items: CipaMandate[] = [];
  private memberCounts: Map<string, number> = new Map();

  async create(data: CreateCipaMandateSchema): Promise<CipaMandate> {
    const id = new UniqueEntityID();
    const cipaMandate = CipaMandate.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        startDate: data.startDate,
        endDate: data.endDate,
        status: (data.status as 'ACTIVE' | 'EXPIRED' | 'DRAFT') ?? 'ACTIVE',
        electionDate: data.electionDate,
        notes: data.notes,
      },
      id,
    );

    this.items.push(cipaMandate);
    return cipaMandate;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMandate | null> {
    const cipaMandate = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return cipaMandate || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindCipaMandateFilters,
  ): Promise<CipaMandate[]> {
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 50, 100);

    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.status) {
      filteredItems = filteredItems.filter(
        (item) => item.status === filters.status,
      );
    }

    const start = (page - 1) * perPage;
    return filteredItems.slice(start, start + perPage);
  }

  async update(data: UpdateCipaMandateSchema): Promise<CipaMandate | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) &&
        (!data.tenantId || item.tenantId.toString() === data.tenantId),
    );

    if (index === -1) return null;

    const existing = this.items[index];

    const updated = CipaMandate.create(
      {
        tenantId: existing.tenantId,
        name: data.name ?? existing.name,
        startDate: data.startDate ?? existing.startDate,
        endDate: data.endDate ?? existing.endDate,
        status:
          (data.status as 'ACTIVE' | 'EXPIRED' | 'DRAFT') ?? existing.status,
        electionDate: data.electionDate ?? existing.electionDate,
        notes: data.notes ?? existing.notes,
      },
      existing.id,
    );

    this.items[index] = updated;
    return updated;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(id) &&
        (!tenantId || item.tenantId.toString() === tenantId),
    );
    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }

  async countMembers(mandateId: UniqueEntityID): Promise<number> {
    return this.memberCounts.get(mandateId.toString()) ?? 0;
  }

  // Helper for tests
  setMemberCount(mandateId: string, count: number): void {
    this.memberCounts.set(mandateId, count);
  }
}
