import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { OKRCheckIn } from '@/entities/hr/okr-check-in';
import type {
  CreateOKRCheckInSchema,
  OKRCheckInsRepository,
} from '../okr-check-ins-repository';

export class InMemoryOKRCheckInsRepository implements OKRCheckInsRepository {
  public items: OKRCheckIn[] = [];

  async create(data: CreateOKRCheckInSchema): Promise<OKRCheckIn> {
    const checkIn = OKRCheckIn.create({
      tenantId: new UniqueEntityID(data.tenantId),
      keyResultId: data.keyResultId,
      employeeId: data.employeeId,
      previousValue: data.previousValue,
      newValue: data.newValue,
      note: data.note,
      confidence: data.confidence,
    });

    this.items.push(checkIn);
    return checkIn;
  }

  async findByKeyResult(
    keyResultId: UniqueEntityID,
    tenantId: string,
  ): Promise<OKRCheckIn[]> {
    return this.items
      .filter(
        (c) =>
          c.keyResultId.equals(keyResultId) &&
          c.tenantId.toString() === tenantId,
      )
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
}
