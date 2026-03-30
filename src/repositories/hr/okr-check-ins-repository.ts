import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { OKRCheckIn } from '@/entities/hr/okr-check-in';

export interface CreateOKRCheckInSchema {
  tenantId: string;
  keyResultId: UniqueEntityID;
  employeeId: UniqueEntityID;
  previousValue: number;
  newValue: number;
  note?: string;
  confidence: string;
}

export interface OKRCheckInsRepository {
  create(data: CreateOKRCheckInSchema): Promise<OKRCheckIn>;
  findByKeyResult(
    keyResultId: UniqueEntityID,
    tenantId: string,
  ): Promise<OKRCheckIn[]>;
}
