import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Form } from '@/entities/sales/form';
import type {
  CreateFormSchema,
  FormsRepository,
} from '../forms-repository';

export class InMemoryFormsRepository implements FormsRepository {
  public items: Form[] = [];

  async create(data: CreateFormSchema): Promise<Form> {
    const form = Form.create({
      tenantId: new UniqueEntityID(data.tenantId),
      title: data.title,
      description: data.description,
      createdBy: data.createdBy,
      status: data.status,
    });

    this.items.push(form);
    return form;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<Form | null> {
    const form = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return form ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
    status?: string,
  ): Promise<Form[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) =>
          !item.deletedAt &&
          item.tenantId.toString() === tenantId &&
          (!status || item.status === status),
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string, status?: string): Promise<number> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.tenantId.toString() === tenantId &&
        (!status || item.status === status),
    ).length;
  }

  async save(form: Form): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(form.id));

    if (index >= 0) {
      this.items[index] = form;
    } else {
      this.items.push(form);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const form = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );

    if (form) {
      form.delete();
    }
  }
}
