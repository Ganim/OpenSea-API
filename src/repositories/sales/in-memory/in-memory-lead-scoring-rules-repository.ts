import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadScoringRule } from '@/entities/sales/lead-scoring-rule';
import type {
  CreateLeadScoringRuleSchema,
  LeadScoringRulesRepository,
} from '../lead-scoring-rules-repository';

export class InMemoryLeadScoringRulesRepository
  implements LeadScoringRulesRepository
{
  public items: LeadScoringRule[] = [];

  async create(data: CreateLeadScoringRuleSchema): Promise<LeadScoringRule> {
    const scoringRule = LeadScoringRule.create({
      tenantId: new UniqueEntityID(data.tenantId),
      name: data.name,
      field: data.field,
      condition: data.condition,
      value: data.value,
      points: data.points,
      isActive: data.isActive ?? true,
    });

    this.items.push(scoringRule);
    return scoringRule;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadScoringRule | null> {
    const scoringRule = this.items.find(
      (item) =>
        !item.deletedAt &&
        item.id.equals(id) &&
        item.tenantId.toString() === tenantId,
    );
    return scoringRule ?? null;
  }

  async findMany(
    page: number,
    perPage: number,
    tenantId: string,
  ): Promise<LeadScoringRule[]> {
    const start = (page - 1) * perPage;
    return this.items
      .filter(
        (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(start, start + perPage);
  }

  async findActiveByTenant(tenantId: string): Promise<LeadScoringRule[]> {
    return this.items.filter(
      (item) =>
        !item.deletedAt &&
        item.isActive &&
        item.tenantId.toString() === tenantId,
    );
  }

  async countByTenant(tenantId: string): Promise<number> {
    return this.items.filter(
      (item) => !item.deletedAt && item.tenantId.toString() === tenantId,
    ).length;
  }

  async save(scoringRule: LeadScoringRule): Promise<void> {
    const index = this.items.findIndex((item) =>
      item.id.equals(scoringRule.id),
    );
    if (index >= 0) {
      this.items[index] = scoringRule;
    } else {
      this.items.push(scoringRule);
    }
  }

  async delete(id: UniqueEntityID, _tenantId: string): Promise<void> {
    const scoringRule = this.items.find(
      (item) => !item.deletedAt && item.id.equals(id),
    );
    if (scoringRule) {
      scoringRule.delete();
    }
  }
}
