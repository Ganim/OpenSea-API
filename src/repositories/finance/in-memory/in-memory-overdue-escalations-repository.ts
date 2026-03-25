import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OverdueEscalation } from '@/entities/finance/overdue-escalation';
import { OverdueEscalationStep } from '@/entities/finance/overdue-escalation-step';
import type {
  CreateOverdueEscalationSchema,
  FindManyEscalationsOptions,
  FindManyEscalationsResult,
  OverdueEscalationsRepository,
  UpdateOverdueEscalationSchema,
} from '../overdue-escalations-repository';

export class InMemoryOverdueEscalationsRepository
  implements OverdueEscalationsRepository
{
  public items: OverdueEscalation[] = [];

  async create(
    data: CreateOverdueEscalationSchema,
  ): Promise<OverdueEscalation> {
    const escalationId = new UniqueEntityID();

    const steps = data.steps.map((stepData) =>
      OverdueEscalationStep.create({
        escalationId,
        daysOverdue: stepData.daysOverdue,
        channel: stepData.channel,
        templateType: stepData.templateType,
        subject: stepData.subject,
        message: stepData.message,
        isActive: stepData.isActive ?? true,
        order: stepData.order,
      }),
    );

    const escalation = OverdueEscalation.create(
      {
        id: escalationId,
        tenantId: new UniqueEntityID(data.tenantId),
        name: data.name,
        isDefault: data.isDefault ?? false,
        isActive: data.isActive ?? true,
        steps,
      },
      escalationId,
    );

    this.items.push(escalation);
    return escalation;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<OverdueEscalation | null> {
    const found = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return found ?? null;
  }

  async findByName(
    name: string,
    tenantId: string,
  ): Promise<OverdueEscalation | null> {
    const found = this.items.find(
      (item) => item.name === name && item.tenantId.toString() === tenantId,
    );
    return found ?? null;
  }

  async findDefault(tenantId: string): Promise<OverdueEscalation | null> {
    const found = this.items.find(
      (item) =>
        item.isDefault &&
        item.isActive &&
        item.tenantId.toString() === tenantId,
    );
    return found ?? null;
  }

  async findMany(
    options: FindManyEscalationsOptions,
  ): Promise<FindManyEscalationsResult> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === options.tenantId,
    );

    if (options.isActive !== undefined) {
      filtered = filtered.filter((item) => item.isActive === options.isActive);
    }

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const start = (page - 1) * limit;
    const escalations = filtered.slice(start, start + limit);

    return { escalations, total };
  }

  async update(
    data: UpdateOverdueEscalationSchema,
  ): Promise<OverdueEscalation | null> {
    const index = this.items.findIndex(
      (item) =>
        item.id.equals(data.id) && item.tenantId.toString() === data.tenantId,
    );
    if (index === -1) return null;

    const existing = this.items[index];
    if (data.name !== undefined) existing.name = data.name;
    if (data.isDefault !== undefined) existing.isDefault = data.isDefault;
    if (data.isActive !== undefined) existing.isActive = data.isActive;

    if (data.steps !== undefined) {
      existing.steps = data.steps.map((stepData) =>
        OverdueEscalationStep.create({
          escalationId: existing.id,
          daysOverdue: stepData.daysOverdue,
          channel: stepData.channel,
          templateType: stepData.templateType,
          subject: stepData.subject,
          message: stepData.message,
          isActive: stepData.isActive ?? true,
          order: stepData.order,
        }),
      );
    }

    return existing;
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    if (index !== -1) {
      this.items[index].isActive = false;
    }
  }

  async clearDefault(tenantId: string, excludeId?: string): Promise<void> {
    for (const item of this.items) {
      if (
        item.tenantId.toString() === tenantId &&
        item.isDefault &&
        (!excludeId || item.id.toString() !== excludeId)
      ) {
        item.isDefault = false;
      }
    }
  }
}
