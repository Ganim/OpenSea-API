import { prisma } from '@/lib/prisma';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Loan } from '@/entities/finance/loan';
import {
  Prisma,
  type LoanType,
  type LoanStatus,
} from '@prisma/generated/client.js';
import type {
  LoansRepository,
  CreateLoanSchema,
  UpdateLoanSchema,
  FindManyLoansOptions,
  FindManyLoansResult,
} from '../loans-repository';

function loanPrismaToDomain(raw: {
  id: string;
  tenantId: string;
  bankAccountId: string;
  costCenterId: string;
  name: string;
  type: string;
  contractNumber: string | null;
  status: string;
  principalAmount: Prisma.Decimal;
  outstandingBalance: Prisma.Decimal;
  interestRate: Prisma.Decimal;
  interestType: string | null;
  startDate: Date;
  endDate: Date | null;
  totalInstallments: number;
  paidInstallments: number;
  installmentDay: number | null;
  notes: string | null;
  metadata: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}): Loan {
  return Loan.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: new UniqueEntityID(raw.tenantId),
      bankAccountId: new UniqueEntityID(raw.bankAccountId),
      costCenterId: new UniqueEntityID(raw.costCenterId),
      name: raw.name,
      type: raw.type,
      contractNumber: raw.contractNumber ?? undefined,
      status: raw.status,
      principalAmount: Number(raw.principalAmount),
      outstandingBalance: Number(raw.outstandingBalance),
      interestRate: Number(raw.interestRate),
      interestType: raw.interestType ?? undefined,
      startDate: raw.startDate,
      endDate: raw.endDate ?? undefined,
      totalInstallments: raw.totalInstallments,
      paidInstallments: raw.paidInstallments,
      installmentDay: raw.installmentDay ?? undefined,
      notes: raw.notes ?? undefined,
      metadata: (raw.metadata as Record<string, unknown>) ?? {},
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      deletedAt: raw.deletedAt ?? undefined,
    },
    new UniqueEntityID(raw.id),
  );
}

export class PrismaLoansRepository implements LoansRepository {
  async create(data: CreateLoanSchema): Promise<Loan> {
    const loan = await prisma.loan.create({
      data: {
        tenantId: data.tenantId,
        bankAccountId: data.bankAccountId,
        costCenterId: data.costCenterId,
        name: data.name,
        type: data.type as LoanType,
        contractNumber: data.contractNumber,
        principalAmount: new Prisma.Decimal(data.principalAmount),
        outstandingBalance: new Prisma.Decimal(data.outstandingBalance),
        interestRate: new Prisma.Decimal(data.interestRate),
        interestType: data.interestType,
        startDate: data.startDate,
        endDate: data.endDate,
        totalInstallments: data.totalInstallments,
        paidInstallments: data.paidInstallments ?? 0,
        installmentDay: data.installmentDay,
        notes: data.notes,
        metadata: (data.metadata ?? {}) as Record<string, never>,
      },
    });

    return loanPrismaToDomain(loan);
  }

  async findById(id: UniqueEntityID, tenantId: string): Promise<Loan | null> {
    const loan = await prisma.loan.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!loan) return null;
    return loanPrismaToDomain(loan);
  }

  async findMany(options: FindManyLoansOptions): Promise<FindManyLoansResult> {
    const page = options.page ?? 1;
    const limit = options.limit ?? 20;

    const where: Prisma.LoanWhereInput = {
      tenantId: options.tenantId,
      deletedAt: null,
    };

    if (options.bankAccountId) where.bankAccountId = options.bankAccountId;
    if (options.costCenterId) where.costCenterId = options.costCenterId;
    if (options.type) where.type = options.type as LoanType;
    if (options.status) where.status = options.status as LoanStatus;

    if (options.search) {
      where.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { contractNumber: { contains: options.search, mode: 'insensitive' } },
      ];
    }

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    return {
      loans: loans.map(loanPrismaToDomain),
      total,
    };
  }

  async update(data: UpdateLoanSchema): Promise<Loan | null> {
    const loan = await prisma.loan.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.contractNumber !== undefined && {
          contractNumber: data.contractNumber,
        }),
        ...(data.status !== undefined && { status: data.status as LoanStatus }),
        ...(data.outstandingBalance !== undefined && {
          outstandingBalance: new Prisma.Decimal(data.outstandingBalance),
        }),
        ...(data.paidInstallments !== undefined && {
          paidInstallments: data.paidInstallments,
        }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.endDate !== undefined && { endDate: data.endDate }),
      },
    });

    return loanPrismaToDomain(loan);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.loan.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
