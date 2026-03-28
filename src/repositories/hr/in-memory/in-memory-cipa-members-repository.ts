import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CipaMember } from '@/entities/hr/cipa-member';
import type {
  CipaMembersRepository,
  CreateCipaMemberSchema,
  FindCipaMemberFilters,
} from '../cipa-members-repository';

export class InMemoryCipaMembersRepository implements CipaMembersRepository {
  private items: CipaMember[] = [];

  async create(data: CreateCipaMemberSchema): Promise<CipaMember> {
    const id = new UniqueEntityID();
    const cipaMember = CipaMember.create(
      {
        tenantId: new UniqueEntityID(data.tenantId),
        mandateId: data.mandateId,
        employeeId: data.employeeId,
        role: data.role as CipaMember['role'],
        type: data.type as CipaMember['type'],
        isStable: data.isStable ?? false,
        stableUntil: data.stableUntil,
      },
      id,
    );

    this.items.push(cipaMember);
    return cipaMember;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember | null> {
    const cipaMember = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return cipaMember || null;
  }

  async findByMandateAndEmployee(
    mandateId: UniqueEntityID,
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember | null> {
    const cipaMember = this.items.find(
      (item) =>
        item.mandateId.equals(mandateId) &&
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId,
    );
    return cipaMember || null;
  }

  async findMany(
    tenantId: string,
    filters?: FindCipaMemberFilters,
  ): Promise<CipaMember[]> {
    let filteredItems = this.items.filter(
      (item) => item.tenantId.toString() === tenantId,
    );

    if (filters?.mandateId) {
      filteredItems = filteredItems.filter((item) =>
        item.mandateId.equals(filters.mandateId!),
      );
    }

    if (filters?.employeeId) {
      filteredItems = filteredItems.filter((item) =>
        item.employeeId.equals(filters.employeeId!),
      );
    }

    const page = filters?.page ?? 1;
    const perPage = filters?.perPage ?? 20;
    const start = (page - 1) * perPage;

    return filteredItems.slice(start, start + perPage);
  }

  async findActiveByEmployeeId(
    employeeId: UniqueEntityID,
    tenantId: string,
  ): Promise<CipaMember[]> {
    return this.items.filter(
      (item) =>
        item.employeeId.equals(employeeId) &&
        item.tenantId.toString() === tenantId,
    );
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
