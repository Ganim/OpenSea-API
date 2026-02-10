import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConsortiumPayment } from '@/entities/finance/consortium-payment';

export interface CreateConsortiumPaymentSchema {
  consortiumId: string;
  bankAccountId?: string;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
}

export interface UpdateConsortiumPaymentSchema {
  id: UniqueEntityID;
  paidAmount?: number;
  paidAt?: Date;
  status?: string;
  bankAccountId?: string | null;
}

export interface ConsortiumPaymentsRepository {
  create(data: CreateConsortiumPaymentSchema): Promise<ConsortiumPayment>;
  createMany(
    data: CreateConsortiumPaymentSchema[],
  ): Promise<ConsortiumPayment[]>;
  findById(id: UniqueEntityID): Promise<ConsortiumPayment | null>;
  findByConsortiumId(
    consortiumId: UniqueEntityID,
  ): Promise<ConsortiumPayment[]>;
  update(
    data: UpdateConsortiumPaymentSchema,
  ): Promise<ConsortiumPayment | null>;
  deleteByConsortiumId(consortiumId: UniqueEntityID): Promise<void>;
}
