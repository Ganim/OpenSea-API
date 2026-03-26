import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LeadScore } from '@/entities/sales/lead-score';
import type {
  CreateLeadScoreSchema,
  LeadScoresRepository,
} from '../lead-scores-repository';

export class InMemoryLeadScoresRepository implements LeadScoresRepository {
  public items: LeadScore[] = [];

  async upsert(data: CreateLeadScoreSchema): Promise<LeadScore> {
    const existingIndex = this.items.findIndex(
      (item) =>
        item.tenantId.toString() === data.tenantId &&
        item.customerId === data.customerId,
    );

    const leadScore = LeadScore.create({
      tenantId: new UniqueEntityID(data.tenantId),
      customerId: data.customerId,
      score: data.score,
      tier: data.tier,
      factors: data.factors as LeadScore['factors'],
      calculatedAt: data.calculatedAt,
    });

    if (existingIndex >= 0) {
      this.items[existingIndex] = leadScore;
    } else {
      this.items.push(leadScore);
    }

    return leadScore;
  }

  async findByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<LeadScore | null> {
    const leadScore = this.items.find(
      (item) =>
        item.tenantId.toString() === tenantId && item.customerId === customerId,
    );
    return leadScore ?? null;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<LeadScore | null> {
    const leadScore = this.items.find(
      (item) => item.id.equals(id) && item.tenantId.toString() === tenantId,
    );
    return leadScore ?? null;
  }

  async findManyByTenant(tenantId: string): Promise<LeadScore[]> {
    return this.items.filter((item) => item.tenantId.toString() === tenantId);
  }

  async deleteByCustomerId(
    tenantId: string,
    customerId: string,
  ): Promise<void> {
    this.items = this.items.filter(
      (item) =>
        !(
          item.tenantId.toString() === tenantId &&
          item.customerId === customerId
        ),
    );
  }
}
