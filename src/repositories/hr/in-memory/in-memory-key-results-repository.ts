import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { KeyResult } from '@/entities/hr/key-result';
import type {
  CreateKeyResultSchema,
  FindKeyResultFilters,
  KeyResultsRepository,
  UpdateKeyResultSchema,
} from '../key-results-repository';

export class InMemoryKeyResultsRepository implements KeyResultsRepository {
  public items: KeyResult[] = [];

  async create(data: CreateKeyResultSchema): Promise<KeyResult> {
    const keyResult = KeyResult.create({
      tenantId: new UniqueEntityID(data.tenantId),
      objectiveId: data.objectiveId,
      title: data.title,
      description: data.description,
      type: data.type,
      startValue: data.startValue ?? 0,
      targetValue: data.targetValue,
      currentValue: data.currentValue ?? 0,
      unit: data.unit,
      status: data.status ?? 'ON_TRACK',
      weight: data.weight ?? 1,
    });

    this.items.push(keyResult);
    return keyResult;
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<KeyResult | null> {
    return (
      this.items.find(
        (kr) => kr.id.equals(id) && kr.tenantId.toString() === tenantId,
      ) ?? null
    );
  }

  async findByObjective(
    objectiveId: UniqueEntityID,
    tenantId: string,
  ): Promise<KeyResult[]> {
    return this.items.filter(
      (kr) =>
        kr.objectiveId.equals(objectiveId) &&
        kr.tenantId.toString() === tenantId,
    );
  }

  async findMany(
    tenantId: string,
    filters?: FindKeyResultFilters,
  ): Promise<{ keyResults: KeyResult[]; total: number }> {
    let filtered = this.items.filter(
      (kr) => kr.tenantId.toString() === tenantId,
    );

    if (filters?.objectiveId) {
      filtered = filtered.filter((kr) =>
        kr.objectiveId.equals(filters.objectiveId!),
      );
    }
    if (filters?.status) {
      filtered = filtered.filter((kr) => kr.status === filters.status);
    }

    const total = filtered.length;
    const sorted = filtered.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
    );
    const page = filters?.page ?? 1;
    const perPage = Math.min(filters?.perPage ?? 20, 100);

    return {
      keyResults: sorted.slice((page - 1) * perPage, page * perPage),
      total,
    };
  }

  async update(data: UpdateKeyResultSchema): Promise<KeyResult | null> {
    const index = this.items.findIndex((kr) => kr.id.equals(data.id));
    if (index === -1) return null;

    const keyResult = this.items[index];
    if (data.title !== undefined) keyResult.props.title = data.title;
    if (data.description !== undefined)
      keyResult.props.description = data.description;
    if (data.type !== undefined) keyResult.props.type = data.type;
    if (data.startValue !== undefined)
      keyResult.props.startValue = data.startValue;
    if (data.targetValue !== undefined)
      keyResult.props.targetValue = data.targetValue;
    if (data.currentValue !== undefined)
      keyResult.props.currentValue = data.currentValue;
    if (data.unit !== undefined) keyResult.props.unit = data.unit;
    if (data.status !== undefined) keyResult.props.status = data.status;
    if (data.weight !== undefined) keyResult.props.weight = data.weight;
    keyResult.props.updatedAt = new Date();

    return keyResult;
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const index = this.items.findIndex((kr) => kr.id.equals(id));
    if (index >= 0) this.items.splice(index, 1);
  }
}
