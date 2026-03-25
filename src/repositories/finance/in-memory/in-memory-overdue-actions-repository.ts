import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OverdueAction } from '@/entities/finance/overdue-action';
import type {
  CreateOverdueActionSchema,
  FindManyOverdueActionsOptions,
  FindManyOverdueActionsResult,
  OverdueActionsRepository,
} from '../overdue-actions-repository';
import type { EscalationActionStatus } from '@/entities/finance/overdue-escalation-types';

export class InMemoryOverdueActionsRepository
  implements OverdueActionsRepository
{
  public items: OverdueAction[] = [];

  async create(data: CreateOverdueActionSchema): Promise<OverdueAction> {
    const action = OverdueAction.create({
      tenantId: new UniqueEntityID(data.tenantId),
      entryId: new UniqueEntityID(data.entryId),
      stepId: data.stepId ? new UniqueEntityID(data.stepId) : undefined,
      channel: data.channel,
      status: data.status ?? 'PENDING',
    });

    this.items.push(action);
    return action;
  }

  async createMany(
    data: CreateOverdueActionSchema[],
  ): Promise<OverdueAction[]> {
    const actions: OverdueAction[] = [];
    for (const actionData of data) {
      const action = await this.create(actionData);
      actions.push(action);
    }
    return actions;
  }

  async findByEntryAndStep(
    entryId: string,
    stepId: string,
    tenantId: string,
  ): Promise<OverdueAction | null> {
    const found = this.items.find(
      (item) =>
        item.entryId.toString() === entryId &&
        item.stepId?.toString() === stepId &&
        item.tenantId.toString() === tenantId,
    );
    return found ?? null;
  }

  async findMany(
    options: FindManyOverdueActionsOptions,
  ): Promise<FindManyOverdueActionsResult> {
    let filtered = this.items.filter(
      (item) => item.tenantId.toString() === options.tenantId,
    );

    if (options.entryId) {
      filtered = filtered.filter(
        (item) => item.entryId.toString() === options.entryId,
      );
    }
    if (options.stepId) {
      filtered = filtered.filter(
        (item) => item.stepId?.toString() === options.stepId,
      );
    }
    if (options.status) {
      filtered = filtered.filter((item) => item.status === options.status);
    }

    const total = filtered.length;
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;
    const start = (page - 1) * limit;
    const actions = filtered.slice(start, start + limit);

    return { actions, total };
  }

  async findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<OverdueAction[]> {
    return this.items.filter(
      (item) =>
        item.entryId.toString() === entryId &&
        item.tenantId.toString() === tenantId,
    );
  }

  async updateStatus(
    id: UniqueEntityID,
    status: EscalationActionStatus,
    error?: string,
  ): Promise<void> {
    const action = this.items.find((item) => item.id.equals(id));
    if (action) {
      action.status = status;
      if (error) action.error = error;
      if (status === 'SENT') action.sentAt = new Date();
    }
  }
}
