import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CreateBankAccountSchema } from '@/repositories/finance/bank-accounts-repository';
import { faker } from '@faker-js/faker';

/**
 * P3-25: Factory for CreateBankAccountSchema — feeds
 * `BankAccountsRepository.create()`. Uses real Brazilian bank codes so
 * any repository branch that validates bankCode picks up a valid
 * default.
 */
export function makeBankAccount(
  overrides: Partial<CreateBankAccountSchema> = {},
): CreateBankAccountSchema {
  const bankCatalog = [
    { code: '001', name: 'Banco do Brasil' },
    { code: '033', name: 'Santander' },
    { code: '104', name: 'Caixa Econômica Federal' },
    { code: '237', name: 'Bradesco' },
    { code: '341', name: 'Itaú Unibanco' },
    { code: '748', name: 'Sicredi' },
    { code: '756', name: 'Sicoob' },
  ];

  const selectedBank = faker.helpers.arrayElement(bankCatalog);

  return {
    tenantId: overrides.tenantId ?? new UniqueEntityID().toString(),
    companyId: overrides.companyId,
    name:
      overrides.name ??
      `${selectedBank.name} - ${faker.finance.accountName()}`,
    bankCode: overrides.bankCode ?? selectedBank.code,
    bankName: overrides.bankName ?? selectedBank.name,
    agency: overrides.agency ?? faker.string.numeric(4),
    agencyDigit: overrides.agencyDigit,
    accountNumber:
      overrides.accountNumber ?? faker.string.numeric(7),
    accountDigit: overrides.accountDigit ?? faker.string.numeric(1),
    accountType:
      overrides.accountType ??
      faker.helpers.arrayElement(['CHECKING', 'SAVINGS']),
    pixKeyType: overrides.pixKeyType,
    pixKey: overrides.pixKey,
    chartOfAccountId: overrides.chartOfAccountId,
    color: overrides.color,
    isDefault: overrides.isDefault ?? false,
    apiEnabled: overrides.apiEnabled ?? false,
  };
}
