import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { BankAccount } from '@/entities/finance/bank-account';
import { bankAccountPrismaToDomain } from '@/mappers/finance/bank-account/bank-account-prisma-to-domain';
import { prisma } from '@/lib/prisma';
import { getFieldCipherService } from '@/services/security/field-cipher-service';
import { ENCRYPTED_FIELD_CONFIG } from '@/services/security/encrypted-field-config';
import type {
  BankAccountsRepository,
  CreateBankAccountSchema,
  UpdateBankAccountSchema,
} from '../bank-accounts-repository';
import type {
  BankAccountType,
  BankAccountStatus,
} from '@prisma/generated/client.js';

const { encryptedFields, hashFields } = ENCRYPTED_FIELD_CONFIG.BankAccount;

function tryGetCipher() {
  try {
    return getFieldCipherService();
  } catch {
    return null;
  }
}

export class PrismaBankAccountsRepository implements BankAccountsRepository {
  async create(data: CreateBankAccountSchema): Promise<BankAccount> {
    const cipher = tryGetCipher();

    // Generate hashes from original plaintext BEFORE encryption
    const hashes = cipher
      ? cipher.generateHashes(
          {
            accountNumber: data.accountNumber,
            pixKey: data.pixKey,
          },
          hashFields,
        )
      : {};

    // Encrypt sensitive fields
    const encryptedData = cipher
      ? cipher.encryptFields(
          {
            accountNumber: data.accountNumber,
            agency: data.agency,
            agencyDigit: data.agencyDigit,
            accountDigit: data.accountDigit,
            pixKey: data.pixKey,
          },
          encryptedFields,
        )
      : {
          accountNumber: data.accountNumber,
          agency: data.agency,
          agencyDigit: data.agencyDigit,
          accountDigit: data.accountDigit,
          pixKey: data.pixKey,
        };

    const bankAccount = await prisma.bankAccount.create({
      data: {
        tenantId: data.tenantId,
        companyId: data.companyId,
        name: data.name,
        bankCode: data.bankCode,
        bankName: data.bankName,
        agency: encryptedData.agency,
        agencyDigit: encryptedData.agencyDigit,
        accountNumber: encryptedData.accountNumber,
        accountDigit: encryptedData.accountDigit,
        accountType: data.accountType as BankAccountType,
        pixKeyType: data.pixKeyType,
        pixKey: encryptedData.pixKey,
        color: data.color,
        isDefault: data.isDefault ?? false,
        ...hashes,
      },
    });

    // Decrypt before passing to mapper
    const decrypted = cipher
      ? cipher.decryptFields(
          bankAccount as Record<string, unknown>,
          encryptedFields,
        )
      : bankAccount;

    return bankAccountPrismaToDomain(decrypted as typeof bankAccount);
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

    const cipher = tryGetCipher();
    const decrypted = cipher
      ? cipher.decryptFields(
          bankAccount as Record<string, unknown>,
          encryptedFields,
        )
      : bankAccount;

    return bankAccountPrismaToDomain(decrypted as typeof bankAccount);
  }

  async findMany(tenantId: string): Promise<BankAccount[]> {
    const bankAccounts = await prisma.bankAccount.findMany({
      where: {
        tenantId,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    const cipher = tryGetCipher();

    return bankAccounts.map((ba) => {
      const decrypted = cipher
        ? cipher.decryptFields(ba as Record<string, unknown>, encryptedFields)
        : ba;
      return bankAccountPrismaToDomain(decrypted as typeof ba);
    });
  }

  async update(data: UpdateBankAccountSchema): Promise<BankAccount | null> {
    const cipher = tryGetCipher();

    // Collect plaintext values for hash generation before encrypting
    const plaintextForHash: Record<string, string | null | undefined> = {};
    if (data.accountNumber !== undefined)
      plaintextForHash.accountNumber = data.accountNumber;
    if (data.pixKey !== undefined) plaintextForHash.pixKey = data.pixKey;

    // Generate hashes from original plaintext
    const hashes =
      cipher && Object.keys(plaintextForHash).length > 0
        ? cipher.generateHashes(plaintextForHash, hashFields)
        : {};

    // Build update data object with original values first
    const updateData: Record<string, unknown> = {
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
      ...hashes,
    };

    // Encrypt the sensitive fields in updateData
    const encryptedUpdateData = cipher
      ? cipher.encryptFields(updateData, encryptedFields)
      : updateData;

    const bankAccount = await prisma.bankAccount.update({
      where: { id: data.id.toString(), tenantId: data.tenantId },
      data: encryptedUpdateData,
    });

    // Decrypt before passing to mapper
    const decrypted = cipher
      ? cipher.decryptFields(
          bankAccount as Record<string, unknown>,
          encryptedFields,
        )
      : bankAccount;

    return bankAccountPrismaToDomain(decrypted as typeof bankAccount);
  }

  async delete(id: UniqueEntityID, tenantId: string): Promise<void> {
    await prisma.bankAccount.update({
      where: { id: id.toString(), tenantId },
      data: { deletedAt: new Date() },
    });
  }
}
