import { prisma } from '@/lib/prisma';
import type { TransactionClient } from '@/lib/transaction-manager';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Loan } from '@/entities/finance/loan';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import { Prisma } from '@prisma/generated/client.js';
import type {
  LoanType,
  LoanStatus,
} from '@/entities/finance/finance-entry-types';
import type {
  LoansRepository,
  CreateLoanSchema,
  UpdateLoanSchema,
  FindManyLoansOptions,
  FindManyLoansResult,
} from '../loans-repository';

const { encryptedFields } = ENCRYPTED_FIELD_CONFIG.Loan;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

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
      type: raw.type as LoanType,
      contractNumber: raw.contractNumber ?? undefined,
      status: raw.status as LoanStatus,
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
  async create(data: CreateLoanSchema, tx?: TransactionClient): Promise<Loan> {
    const client = tx ?? prisma;
    const cipher = tryGetCipher();

    // Encrypt contractNumber before create
    const encryptedContractNumber =
      cipher && data.contractNumber
        ? cipher.encrypt(data.contractNumber)
        : data.contractNumber;

    const loan = await client.loan.create({
      data: {
        tenantId: data.tenantId,
        bankAccountId: data.bankAccountId,
        costCenterId: data.costCenterId,
        name: data.name,
        type: data.type as LoanType,
        contractNumber: encryptedContractNumber,
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

    // Decrypt before passing to mapper
    const decrypted = cipher
      ? cipher.decryptFields(loan as Record<string, unknown>, encryptedFields)
      : loan;

    return loanPrismaToDomain(decrypted as typeof loan);
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

    const cipher = tryGetCipher();
    const decrypted = cipher
      ? cipher.decryptFields(loan as Record<string, unknown>, encryptedFields)
      : loan;

    return loanPrismaToDomain(decrypted as typeof loan);
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

    // P1-40: schema now exposes the real model columns (principalAmount,
    // name) directly. Legacy aliases kept for one release so any cached
    // frontend bundle that still sends them keeps working.
    const sortFieldMap: Record<string, string> = {
      createdAt: 'createdAt',
      principalAmount: 'principalAmount',
      name: 'name',
      status: 'status',
      // Deprecated aliases:
      totalAmount: 'principalAmount',
      institution: 'name',
    };

    const orderBy: Record<string, 'asc' | 'desc'> = {};
    orderBy[sortFieldMap[options.sortBy || 'createdAt'] || 'createdAt'] =
      options.sortOrder || 'desc';

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.loan.count({ where }),
    ]);

    const cipher = tryGetCipher();

    return {
      loans: loans.map((l) => {
        const decrypted = cipher
          ? cipher.decryptFields(l as Record<string, unknown>, encryptedFields)
          : l;
        return loanPrismaToDomain(decrypted as typeof l);
      }),
      total,
    };
  }

  async update(
    data: UpdateLoanSchema,
    tx?: TransactionClient,
  ): Promise<Loan | null> {
    const client = tx ?? prisma;
    const cipher = tryGetCipher();

    // Build update data
    const updateData: Record<string, unknown> = {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type as LoanType }),
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
      ...(data.interestRate !== undefined && {
        interestRate: new Prisma.Decimal(data.interestRate),
      }),
      ...(data.interestType !== undefined && {
        interestType: data.interestType,
      }),
      ...(data.installmentDay !== undefined && {
        installmentDay: data.installmentDay,
      }),
      ...(data.bankAccountId !== undefined && {
        bankAccountId: data.bankAccountId,
      }),
      ...(data.costCenterId !== undefined && {
        costCenterId: data.costCenterId,
      }),
    };

    // Encrypt the sensitive fields in updateData
    const encryptedUpdateData = cipher
      ? cipher.encryptFields(updateData, encryptedFields)
      : updateData;

    const whereClause: { id: string; tenantId?: string } = {
      id: data.id.toString(),
    };
    if (data.tenantId) {
      whereClause.tenantId = data.tenantId;
    }

    const loan = await client.loan.update({
      where: whereClause,
      data: encryptedUpdateData,
    });

    // Decrypt before passing to mapper
    const decrypted = cipher
      ? cipher.decryptFields(loan as Record<string, unknown>, encryptedFields)
      : loan;

    return loanPrismaToDomain(decrypted as typeof loan);
  }

  async delete(id: UniqueEntityID, tenantId?: string): Promise<void> {
    const whereClause: { id: string; tenantId?: string } = {
      id: id.toString(),
    };
    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    await prisma.loan.update({
      where: whereClause,
      data: { deletedAt: new Date() },
    });
  }
}
