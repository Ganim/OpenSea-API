import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Workflow, type WorkflowTriggerType } from '@/entities/sales/workflow';
import type {
  CreateWorkflowSchema,
  WorkflowsRepository,
} from '../workflows-repository';

export class InMemoryWorkflowsRepository implements WorkflowsRepository {
  public items: Workflow[] = [];

  async create(data: CreateWorkflowSchema): Promise<Workflow> {
    const workflow = Workflow.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      description: data.description,
      trigger: data.trigger,
      isActive: data.isActive ?? false,
      steps: (data.steps ?? []).map((step) => ({
        id: new UniqueEntityID(),
        workflowId: new UniqueEntityID(), // will be set properly
        order: step.order,
        type: step.type,
        config: step.config,
        createdAt: new Date(),
      })),
    });

    // Fix workflowId references
    workflow.steps = workflow.steps.map((step) => ({
      ...step,
      workflowId: workflow.id,
    }));

    this.items.push(workflow);
    return workflow;
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Workflow | null> {
    const workflow = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return workflow ?? null;
  }

  async findByTrigger(trigger: WorkflowTriggerType, tenantId: string): Promise<Workflow[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.trigger === trigger &&
        item.tenantId.toString() === tenantId,
    );
  }

  async findMany(page: number, perPage: number, tenantId: string): Promise<Workflow[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter((item) => !item.deletedAt && item.tenantId.toString() === tenantId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    ).length;
  }

  async save(workflow: Workflow): Promise<void> {
    const index = this.items.findIndex((item) => item.id.equals(workflow.id));
    if (index >= 0) {
      this.items[index] = workflow;
    } else {
      this.items.push(workflow);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const workflow = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (workflow) {
      workflow.delete();
    }
  }
}
