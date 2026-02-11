import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankAccount } from '@/entities/finance/bank-account';
import { bankAccountPrismaToDomain } from '@/mappers/finance/bank-account/bank-account-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import type {
  BankAccountsRepository,
  CreateBankAccountSchema,
  UpdateBankAccountSchema,
} from '../bank-accounts-repository';
import type {
  BankAccountType,
  BankAccountStatus,
} from '@prisma/generated/client.js';

export class PrismaBankAccountsRepository implements BankAccountsRepository {
  async create(data: CreateBankAccountSchema): Promise<BankAccount> {
    const bankAccount = await prisma.bankAccount.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId,
        name: data.name,
        bankCode: data.bankCode,
        bankName: data.bankName,
        agency: data.agency,
        agencyDigit: data.agencyDigit,
        accountNumber: data.accountNumber,
        accountDigit: data.accountDigit,
        accountType: data.accountType as BankAccountType,
        pixKeyType: data.pixKeyType,
        pixKey: data.pixKey,
        color: data.color,
        isDefault: data.isDefault ?? false,
      },
    });

    return bankAccountPrismaToDomain(bankAccount);
  }

  async findById(
    id: UniqueEntityID,
    tenantId: string,
  ): Promise<BankAccount | null> {
    const bankAccount = await prisma.bankAccount.findFirst({
      where: {
        id: id.toString(),
        tenantId,
        deletedAt: null,
      },
    });

    if (!bankAccount) return null;
    return bankAccountPrismaToDomain(bankAccount);
  }

  async findMany(tenantId: string): Promise<BankAccount[]> {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    return bankAccounts.map(bankAccountPrismaToDomain);
  }

  async update(data: UpdateBankAccountSchema): Promise<BankAccount | null> {
    const bankAccount = await prisma.bankAccount.update({
      where: { id: data.id.toString() },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.bankName !== undefined && { bankName: data.bankName }),
        ...(data.agency !== undefined && { agency: data.agency }),
        ...(data.agencyDigit !== undefined && {
          agencyDigit: data.agencyDigit,
        }),
        ...(data.accountNumber !== undefined && {
          accountNumber: data.accountNumber,
        }),
        ...(data.accountDigit !== undefined && {
          accountDigit: data.accountDigit,
        }),
        ...(data.accountType !== undefined && {
          accountType: data.accountType as BankAccountType,
        }),
        ...(data.status !== undefined && {
          status: data.status as BankAccountStatus,
        }),
        ...(data.pixKeyType !== undefined && { pixKeyType: data.pixKeyType }),
        ...(data.pixKey !== undefined && { pixKey: data.pixKey }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
      },
    });

    return bankAccountPrismaToDomain(bankAccount);
  }

  async delete(id: UniqueEntityID): Promise<void> {
    await prisma.bankAccount.update({
      where: { id: id.toString() },
      data: { deletedAt: new Date() },
    });
  }
}
