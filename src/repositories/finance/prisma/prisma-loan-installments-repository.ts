import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { LoanInstallment } from '@/entities/finance/loan-installment';
import { Prisma } from '@prisma/generated/client.js';
import type {
  LoanInstallmentsRepository,
  CreateLoanInstallmentSchema,
  UpdateLoanInstallmentSchema,
} from '../loan-installments-repository';

function installmentPrismaToDomain(raw: {
  id: string;
  loanId: string;
  bankAccountId: string | null;
  installmentNumber: number;
  dueDate: Date;
  principalAmount: Prisma.Decimal;
  interestAmount: Prisma.Decimal;
  totalAmount: Prisma.Decimal;
  paidAmount: Prisma.Decimal | null;
  paidAt: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): LoanInstallment {
  return LoanInstallment.create(
    {
      id: new UniqueEntityID(raw.id),
      loanId: new UniqueEntityID(raw.loanId),
      bankAccountId: raw.bankAccountId
        ? new UniqueEntityID(raw.bankAccountId)
        : undefined,
      installmentNumber: raw.installmentNumber,
      dueDate: raw.dueDate,
      principalAmount: Number(raw.principalAmount),
      interestAmount: Number(raw.interestAmount),
      totalAmount: Number(raw.totalAmount),
      paidAmount: raw.paidAmount ? Number(raw.paidAmount) : undefined,
      paidAt: raw.paidAt ?? undefined,
      status: raw.status,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaLoanInstallmentsRepository
  implements LoanInstallmentsRepository
{
  async create(data: CreateLoanInstallmentSchema): Promise<LoanInstallment> {
    const installment = await prisma.loanInstallment.create({
      data: {
        loanId: data.loanId,
        bankAccountId: data.bankAccountId,
        installmentNumber: data.installmentNumber,
        dueDate: data.dueDate,
        principalAmount: new Prisma.Decimal(data.principalAmount),
        interestAmount: new Prisma.Decimal(data.interestAmount),
        totalAmount: new Prisma.Decimal(data.totalAmount),
      },
    });

    return installmentPrismaToDomain(installment);
  }

  async createMany(
    data: CreateLoanInstallmentSchema[],
  ): Promise<LoanInstallment[]> {
    const installments: LoanInstallment[] = [];
    for (const item of data) {
      const installment = await this.create(item);
      installments.push(installment);
    }
    return installments;
  }

  async findById(id: UniqueEntityID): Promise<LoanInstallment | null> {
    const installment = await prisma.loanInstallment.findUnique({
      where: { id: id.toString() },
    });

    if (!installment) return null;
    return installmentPrismaToDomain(installment);
  }

  async findByLoanId(loanId: UniqueEntityID): Promise<LoanInstallment[]> {
    const installments = await prisma.loanInstallment.findMany({
      where: { loanId: loanId.toString() },
      orderBy: { installmentNumber: 'asc' },
    });

    return installments.map(installmentPrismaToDomain);
  }

  async update(
    data: UpdateLoanInstallmentSchema,
  ): Promise<LoanInstallment | null> {
    const installment = await prisma.loanInstallment.update({
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

    return installmentPrismaToDomain(installment);
  }

  async deleteByLoanId(loanId: UniqueEntityID): Promise<void> {
    await prisma.loanInstallment.deleteMany({
      where: { loanId: loanId.toString() },
    });
  }
}
