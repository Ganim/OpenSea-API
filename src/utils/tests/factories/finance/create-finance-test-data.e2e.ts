import { prisma } from '@/lib/prisma';
import { randomUUID } from 'node:crypto';

/**
 * Creates a Company directly in the database for E2E tests.
 * BankAccount has FK to Company, so we need a real one.
 */
export async function createCompany(tenantId: string) {
  const ts = Date.now();
  return prisma.company.create({
    data: {
      id: randomUUID(),
      tenantId,
      legalName: `Test Company ${ts}`,
      cnpj: `${ts}`.slice(-14).padStart(14, '0'),
    },
  });
}

/**
 * Creates a CostCenter directly in the database for E2E tests.
 */
export async function createCostCenter(
  tenantId: string,
  override: Partial<{
    code: string;
    name: string;
    description: string;
    isActive: boolean;
    monthlyBudget: number;
    annualBudget: number;
  }> = {},
) {
  const ts = Date.now();
  return prisma.costCenter.create({
    data: {
      id: randomUUID(),
      tenantId,
      code: override.code ?? `CC-${ts}`,
      name: override.name ?? `Cost Center ${ts}`,
      description: override.description,
      isActive: override.isActive ?? true,
      monthlyBudget: override.monthlyBudget,
      annualBudget: override.annualBudget,
    },
  });
}

/**
 * Creates a BankAccount directly in the database for E2E tests.
 * Automatically creates a Company if companyId is not provided.
 */
export async function createBankAccount(
  tenantId: string,
  override: Partial<{
    companyId: string;
    name: string;
    bankCode: string;
    bankName: string;
    agency: string;
    accountNumber: string;
    accountType: string;
    status: string;
    isDefault: boolean;
  }> = {},
) {
  const ts = Date.now();

  // Create a real company if companyId not provided (FK constraint)
  let companyId = override.companyId;
  if (!companyId) {
    const company = await createCompany(tenantId);
    companyId = company.id;
  }

  return prisma.bankAccount.create({
    data: {
      id: randomUUID(),
      tenantId,
      companyId,
      name: override.name ?? `Bank Account ${ts}`,
      bankCode: override.bankCode ?? '001',
      bankName: override.bankName ?? 'Banco do Brasil',
      agency: override.agency ?? '1234',
      accountNumber: override.accountNumber ?? `${ts}`.slice(-8),
      accountType: override.accountType ?? 'CHECKING',
      status: override.status ?? 'ACTIVE',
      currentBalance: 0,
      isDefault: override.isDefault ?? false,
    },
  });
}

/**
 * Creates a FinanceCategory directly in the database for E2E tests.
 */
export async function createFinanceCategory(
  tenantId: string,
  override: Partial<{
    name: string;
    slug: string;
    type: string;
    description: string;
    isActive: boolean;
    displayOrder: number;
  }> = {},
) {
  const ts = Date.now();
  const name = override.name ?? `Category ${ts}`;
  return prisma.financeCategory.create({
    data: {
      id: randomUUID(),
      tenantId,
      name,
      slug: override.slug ?? `category-${ts}`,
      type: override.type ?? 'EXPENSE',
      description: override.description,
      isActive: override.isActive ?? true,
      isSystem: false,
      displayOrder: override.displayOrder ?? 0,
    },
  });
}

/**
 * Creates a FinanceEntry directly in the database for E2E tests.
 */
export async function createFinanceEntry(
  tenantId: string,
  deps: { categoryId: string; costCenterId: string },
  override: Partial<{
    type: string;
    code: string;
    description: string;
    supplierName: string;
    customerName: string;
    expectedAmount: number;
    issueDate: Date;
    dueDate: Date;
    status: string;
    recurrenceType: string;
    tags: string[];
  }> = {},
) {
  const ts = Date.now();
  return prisma.financeEntry.create({
    data: {
      id: randomUUID(),
      tenantId,
      type: override.type ?? 'PAYABLE',
      code: override.code ?? `PAY-${ts}`,
      description: override.description ?? `Entry ${ts}`,
      categoryId: deps.categoryId,
      costCenterId: deps.costCenterId,
      supplierName: override.supplierName,
      customerName: override.customerName,
      expectedAmount: override.expectedAmount ?? 1000,
      discount: 0,
      interest: 0,
      penalty: 0,
      issueDate: override.issueDate ?? new Date(),
      dueDate: override.dueDate ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: override.status ?? 'PENDING',
      recurrenceType: override.recurrenceType ?? 'SINGLE',
      tags: override.tags ?? [],
    },
  });
}

/**
 * Creates full prerequisite data for finance E2E tests (category + costCenter + bankAccount).
 * The bankAccount automatically creates a Company to satisfy FK constraints.
 */
export async function createFinancePrerequisites(tenantId: string) {
  const category = await createFinanceCategory(tenantId);
  const costCenter = await createCostCenter(tenantId);
  const bankAccount = await createBankAccount(tenantId);

  return { category, costCenter, bankAccount };
}
