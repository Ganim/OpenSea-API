import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ConsortiumPayment } from '@/entities/finance/consortium-payment';
import type {
  ConsortiumPaymentsRepository,
  CreateConsortiumPaymentSchema,
  UpdateConsortiumPaymentSchema,
} from '../consortium-payments-repository';

export class InMemoryConsortiumPaymentsRepository
  implements ConsortiumPaymentsRepository
{
  public items: ConsortiumPayment[] = [];

  async create(
    data: CreateConsortiumPaymentSchema,
  ): Promise<ConsortiumPayment> {
    const payment = ConsortiumPayment.create({
      consortiumId: new UniqueEntityID(data.consortiumId),
      bankAccountId: data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined,
      installmentNumber: data.installmentNumber,
      dueDate: data.dueDate,
      expectedAmount: data.expectedAmount,
    });

    this.items.push(payment);
    return payment;
  }

  async createMany(
    data: CreateConsortiumPaymentSchema[],
  ): Promise<ConsortiumPayment[]> {
    const payments: ConsortiumPayment[] = [];
    for (const item of data) {
      const payment = await this.create(item);
      payments.push(payment);
    }
    return payments;
  }

  async findById(id: UniqueEntityID): Promise<ConsortiumPayment | null> {
    const item = this.items.find((i) => i.id.equals(id));
    return item ?? null;
  }

  async findByConsortiumId(
    consortiumId: UniqueEntityID,
  ): Promise<ConsortiumPayment[]> {
    return this.items
      .filter((i) => i.consortiumId.equals(consortiumId))
      .sort((a, b) => a.installmentNumber - b.installmentNumber);
  }

  async update(
    data: UpdateConsortiumPaymentSchema,
  ): Promise<ConsortiumPayment | null> {
    const item = this.items.find((i) => i.id.equals(data.id));
    if (!item) return null;

    if (data.paidAmount !== undefined) item.paidAmount = data.paidAmount;
    if (data.paidAt !== undefined) item.paidAt = data.paidAt;
    if (data.status !== undefined) item.status = data.status;
    if (data.bankAccountId !== undefined) {
      item.bankAccountId = data.bankAccountId
        ? new UniqueEntityID(data.bankAccountId)
        : undefined;
    }

    return item;
  }

  async deleteByConsortiumId(consortiumId: UniqueEntityID): Promise<void> {
    this.items = this.items.filter((i) => !i.consortiumId.equals(consortiumId));
  }
}
