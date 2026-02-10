import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { ConsortiumPayment } from '@/entities/finance/consortium-payment';
import { Prisma } from '@prisma/generated/client.js';
import type {
  ConsortiumPaymentsRepository,
  CreateConsortiumPaymentSchema,
  UpdateConsortiumPaymentSchema,
} from '../consortium-payments-repository';

function paymentPrismaToDomain(raw: {
  id: string;
  consortiumId: string;
  bankAccountId: string | null;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal | null;
  paidAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): ConsortiumPayment {
  return ConsortiumPayment.create(
    {
      id: new UniqueEntityID(raw.id),
      consortiumId: new UniqueEntityID(raw.consortiumId),
      bankAccountId: raw.bankAccountId
        ? new UniqueEntityID(raw.bankAccountId)
        : undefined,
      installmentNumber: raw.installmentNumber,
      dueDate: raw.dueDate,
      expectedAmount: Number(raw.expectedAmount),
      paidAmount: raw.paidAmount ? Number(raw.paidAmount) : undefined,
      paidAt: raw.paidAt ?? undefined,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaConsortiumPaymentsRepository
  implements ConsortiumPaymentsRepository
{
  async create(
    data: CreateConsortiumPaymentSchema,
  ): Promise<ConsortiumPayment> {
    const payment = await prisma.consortiumPayment.create({
      data: {
        consortiumId: data.consortiumId,
        bankAccountId: data.bankAccountId,
        installmentNumber: data.installmentNumber,
        dueDate: data.dueDate,
        expectedAmount: new Prisma.Decimal(data.expectedAmount),
      },
    });

    return paymentPrismaToDomain(payment);
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
    const payment = await prisma.consortiumPayment.findUnique({
      where: { id: id.toString() },
    });

    if (!payment) return null;
    return paymentPrismaToDomain(payment);
  }

  async findByConsortiumId(
    consortiumId: UniqueEntityID,
  ): Promise<ConsortiumPayment[]> {
    const payments = await prisma.consortiumPayment.findMany({
      where: { consortiumId: consortiumId.toString() },
      orderBy: { installmentNumber: 'asc' },
    });

    return payments.map(paymentPrismaToDomain);
  }

  async update(
    data: UpdateConsortiumPaymentSchema,
  ): Promise<ConsortiumPayment | null> {
    const payment = await prisma.consortiumPayment.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.paidAmount !== undefined && {
          paidAmount: new Prisma.Decimal(data.paidAmount),
        }),
        ...(data.paidAt !== undefined && { paidAt: data.paidAt }),
        ...(data.status !== undefined && { status: data.status }),
        ...(data.bankAccountId !== undefined && {
          bankAccountId: data.bankAccountId,
        }),
      },
    });

    return paymentPrismaToDomain(payment);
  }

  async deleteByConsortiumId(consortiumId: UniqueEntityID): Promise<void> {
    await prisma.consortiumPayment.deleteMany({
      where: { consortiumId: consortiumId.toString() },
    });
  }
}
