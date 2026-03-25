import type { ToolHandler, ToolExecutionContext } from '../tool-types';
import { TOOL_LIST_MAX_ITEMS } from '../tool-types';

// === Entry Factories ===
import { makeListFinanceEntriesUseCase } from '@/use-cases/finance/entries/factories/make-list-finance-entries-use-case';
import { makeGetFinanceEntryByIdUseCase } from '@/use-cases/finance/entries/factories/make-get-finance-entry-by-id-use-case';
import { makeCreateFinanceEntryUseCase } from '@/use-cases/finance/entries/factories/make-create-finance-entry-use-case';
import { makeRegisterPaymentUseCase } from '@/use-cases/finance/entries/factories/make-register-payment-use-case';
import { makeCancelFinanceEntryUseCase } from '@/use-cases/finance/entries/factories/make-cancel-finance-entry-use-case';
import { makeCheckOverdueEntriesUseCase } from '@/use-cases/finance/entries/factories/make-check-overdue-entries-use-case';

// === Cost Center Factories ===
import { makeListCostCentersUseCase } from '@/use-cases/finance/cost-centers/factories/make-list-cost-centers-use-case';
import { makeCreateCostCenterUseCase } from '@/use-cases/finance/cost-centers/factories/make-create-cost-center-use-case';

// === Bank Account Factories ===
import { makeListBankAccountsUseCase } from '@/use-cases/finance/bank-accounts/factories/make-list-bank-accounts-use-case';
import { makeGetBankAccountByIdUseCase } from '@/use-cases/finance/bank-accounts/factories/make-get-bank-account-by-id-use-case';
import { makeCreateBankAccountUseCase } from '@/use-cases/finance/bank-accounts/factories/make-create-bank-account-use-case';

// === Category Factories ===
import { makeListFinanceCategoriesUseCase } from '@/use-cases/finance/categories/factories/make-list-finance-categories-use-case';
import { makeCreateFinanceCategoryUseCase } from '@/use-cases/finance/categories/factories/make-create-finance-category-use-case';

// === Loan Factories ===
import { makeListLoansUseCase } from '@/use-cases/finance/loans/factories/make-list-loans-use-case';
import { makeGetLoanByIdUseCase } from '@/use-cases/finance/loans/factories/make-get-loan-by-id-use-case';

// === Consortium Factories ===
import { makeListConsortiaUseCase } from '@/use-cases/finance/consortia/factories/make-list-consortia-use-case';
import { makeGetConsortiumByIdUseCase } from '@/use-cases/finance/consortia/factories/make-get-consortium-by-id-use-case';

// === Dashboard Factories ===
import { makeGetFinanceDashboardUseCase } from '@/use-cases/finance/dashboard/factories/make-get-finance-dashboard-use-case';
import { makeGetCashflowUseCase } from '@/use-cases/finance/dashboard/factories/make-get-cashflow-use-case';

// ─── Helpers ─────────────────────────────────────────────────────────

function clampLimit(limit: unknown, fallback = 10): number {
  const n = typeof limit === 'number' ? limit : fallback;
  return Math.min(Math.max(1, n), TOOL_LIST_MAX_ITEMS);
}

function parseDate(value: unknown): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? undefined : d;
}

// ─── Export ──────────────────────────────────────────────────────────

export function getFinanceHandlers(): Record<string, ToolHandler> {
  return {
    // =========================================================
    // QUERY TOOLS (10)
    // =========================================================

    finance_list_entries: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListFinanceEntriesUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          type: args.type as string | undefined,
          status: args.status as string | undefined,
          categoryId: args.categoryId as string | undefined,
          costCenterId: args.costCenterId as string | undefined,
          bankAccountId: args.bankAccountId as string | undefined,
          dueDateFrom: parseDate(args.dueDateFrom),
          dueDateTo: parseDate(args.dueDateTo),
          isOverdue: args.isOverdue as boolean | undefined,
          search: args.search as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.entries.length,
          entries: result.entries.slice(0, TOOL_LIST_MAX_ITEMS).map((e) => ({
            id: e.id,
            code: e.code,
            type: e.type,
            description: e.description?.slice(0, 100),
            status: e.status,
            expectedAmount: e.expectedAmount,
            totalDue: e.totalDue,
            remainingBalance: e.remainingBalance,
            dueDate: e.dueDate,
            isOverdue: e.isOverdue,
            supplierName: e.supplierName,
            customerName: e.customerName,
          })),
        };
      },
    },

    finance_get_entry: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.entryId) {
          return { error: 'Informe o entryId do lançamento.' };
        }

        const useCase = makeGetFinanceEntryByIdUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.entryId as string,
        });

        const e = result.entry;
        return {
          id: e.id,
          code: e.code,
          type: e.type,
          description: e.description,
          notes: e.notes,
          status: e.status,
          categoryId: e.categoryId,
          costCenterId: e.costCenterId,
          bankAccountId: e.bankAccountId,
          supplierName: e.supplierName,
          customerName: e.customerName,
          expectedAmount: e.expectedAmount,
          actualAmount: e.actualAmount,
          discount: e.discount,
          interest: e.interest,
          penalty: e.penalty,
          totalDue: e.totalDue,
          remainingBalance: e.remainingBalance,
          isOverdue: e.isOverdue,
          issueDate: e.issueDate,
          dueDate: e.dueDate,
          paymentDate: e.paymentDate,
          recurrenceType: e.recurrenceType,
          totalInstallments: e.totalInstallments,
          currentInstallment: e.currentInstallment,
          tags: e.tags,
          createdAt: e.createdAt,
          payments: result.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            paidAt: p.paidAt,
            method: p.method,
            reference: p.reference,
          })),
        };
      },
    },

    finance_list_cost_centers: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListCostCentersUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.costCenters.length,
          costCenters: result.costCenters
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((cc) => ({
              id: cc.id,
              code: cc.code,
              name: cc.name,
              description: cc.description,
              isActive: cc.isActive,
              monthlyBudget: cc.monthlyBudget,
              annualBudget: cc.annualBudget,
              parentId: cc.parentId,
            })),
        };
      },
    },

    finance_list_bank_accounts: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListBankAccountsUseCase();
        const result = await useCase.execute({ tenantId: context.tenantId });
        return {
          total: result.bankAccounts.length,
          bankAccounts: result.bankAccounts
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((ba) => ({
              id: ba.id,
              name: ba.name,
              bankCode: ba.bankCode,
              bankName: ba.bankName,
              agency: ba.agency,
              accountNumber: ba.accountNumber,
              accountType: ba.accountType,
              status: ba.status,
              currentBalance: ba.currentBalance,
              isDefault: ba.isDefault,
              color: ba.color,
            })),
        };
      },
    },

    finance_get_bank_account: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.bankAccountId) {
          return { error: 'Informe o bankAccountId da conta bancária.' };
        }

        const useCase = makeGetBankAccountByIdUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.bankAccountId as string,
        });

        const ba = result.bankAccount;
        return {
          id: ba.id,
          name: ba.name,
          bankCode: ba.bankCode,
          bankName: ba.bankName,
          agency: ba.agency,
          agencyDigit: ba.agencyDigit,
          accountNumber: ba.accountNumber,
          accountDigit: ba.accountDigit,
          accountType: ba.accountType,
          status: ba.status,
          pixKeyType: ba.pixKeyType,
          pixKey: ba.pixKey,
          currentBalance: ba.currentBalance,
          balanceUpdatedAt: ba.balanceUpdatedAt,
          color: ba.color,
          isDefault: ba.isDefault,
          createdAt: ba.createdAt,
        };
      },
    },

    finance_list_categories: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListFinanceCategoriesUseCase();
        const result = await useCase.execute({ tenantId: context.tenantId });
        return {
          total: result.categories.length,
          categories: result.categories
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((c) => ({
              id: c.id,
              name: c.name,
              slug: c.slug,
              type: c.type,
              description: c.description,
              color: c.color,
              parentId: c.parentId,
              isActive: c.isActive,
              isSystem: c.isSystem,
            })),
        };
      },
    },

    finance_list_loans: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListLoansUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          type: args.type as string | undefined,
          status: args.status as string | undefined,
          search: args.search as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.loans.length,
          loans: result.loans.slice(0, TOOL_LIST_MAX_ITEMS).map((l) => ({
            id: l.id,
            name: l.name,
            type: l.type,
            contractNumber: l.contractNumber,
            status: l.status,
            principalAmount: l.principalAmount,
            outstandingBalance: l.outstandingBalance,
            interestRate: l.interestRate,
            totalInstallments: l.totalInstallments,
            paidInstallments: l.paidInstallments,
            progressPercentage: l.progressPercentage,
            isActive: l.isActive,
          })),
        };
      },
    },

    finance_get_loan: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.loanId) {
          return { error: 'Informe o loanId do empréstimo.' };
        }

        const useCase = makeGetLoanByIdUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.loanId as string,
        });

        const l = result.loan;
        return {
          id: l.id,
          name: l.name,
          type: l.type,
          contractNumber: l.contractNumber,
          status: l.status,
          principalAmount: l.principalAmount,
          outstandingBalance: l.outstandingBalance,
          interestRate: l.interestRate,
          interestType: l.interestType,
          startDate: l.startDate,
          endDate: l.endDate,
          totalInstallments: l.totalInstallments,
          paidInstallments: l.paidInstallments,
          remainingInstallments: l.remainingInstallments,
          progressPercentage: l.progressPercentage,
          isActive: l.isActive,
          isDefaulted: l.isDefaulted,
          notes: l.notes,
          installments: result.installments
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((i) => ({
              id: i.id,
              installmentNumber: i.installmentNumber,
              totalAmount: i.totalAmount,
              principalAmount: i.principalAmount,
              interestAmount: i.interestAmount,
              dueDate: i.dueDate,
              status: i.status,
              isPaid: i.isPaid,
              paidAt: i.paidAt,
            })),
        };
      },
    },

    finance_list_consortia: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListConsortiaUseCase();
        const limit = clampLimit(args.limit);
        const result = await useCase.execute({
          tenantId: context.tenantId,
          status: args.status as string | undefined,
          isContemplated: args.isContemplated as boolean | undefined,
          search: args.search as string | undefined,
          page: (args.page as number) ?? 1,
          limit,
        });
        return {
          total: result.meta.total,
          page: result.meta.page,
          pages: result.meta.pages,
          showing: result.consortia.length,
          consortia: result.consortia
            .slice(0, TOOL_LIST_MAX_ITEMS)
            .map((c) => ({
              id: c.id,
              name: c.name,
              administrator: c.administrator,
              groupNumber: c.groupNumber,
              quotaNumber: c.quotaNumber,
              status: c.status,
              creditValue: c.creditValue,
              monthlyPayment: c.monthlyPayment,
              totalInstallments: c.totalInstallments,
              paidInstallments: c.paidInstallments,
              isContemplated: c.isContemplated,
              progressPercentage: c.progressPercentage,
            })),
        };
      },
    },

    finance_get_consortium: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        if (!args.consortiumId) {
          return { error: 'Informe o consortiumId do consórcio.' };
        }

        const useCase = makeGetConsortiumByIdUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.consortiumId as string,
        });

        const c = result.consortium;
        return {
          id: c.id,
          name: c.name,
          administrator: c.administrator,
          groupNumber: c.groupNumber,
          quotaNumber: c.quotaNumber,
          contractNumber: c.contractNumber,
          status: c.status,
          creditValue: c.creditValue,
          monthlyPayment: c.monthlyPayment,
          totalInstallments: c.totalInstallments,
          paidInstallments: c.paidInstallments,
          remainingInstallments: c.remainingInstallments,
          progressPercentage: c.progressPercentage,
          isContemplated: c.isContemplated,
          contemplatedAt: c.contemplatedAt,
          contemplationType: c.contemplationType,
          startDate: c.startDate,
          endDate: c.endDate,
          notes: c.notes,
          payments: result.payments.slice(0, TOOL_LIST_MAX_ITEMS).map((p) => ({
            id: p.id,
            installmentNumber: p.installmentNumber,
            expectedAmount: p.expectedAmount,
            paidAmount: p.paidAmount,
            paidAt: p.paidAt,
            status: p.status,
            isPaid: p.isPaid,
          })),
        };
      },
    },

    // =========================================================
    // ACTION TOOLS (5)
    // =========================================================

    finance_create_entry: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateFinanceEntryUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          type: args.type as 'PAYABLE' | 'RECEIVABLE',
          description: args.description as string,
          categoryId: args.categoryId as string,
          expectedAmount: args.expectedAmount as number,
          dueDate: new Date(args.dueDate as string),
          issueDate: args.issueDate
            ? new Date(args.issueDate as string)
            : new Date(),
          costCenterId: args.costCenterId as string | undefined,
          bankAccountId: args.bankAccountId as string | undefined,
          supplierName: args.supplierName as string | undefined,
          customerName: args.customerName as string | undefined,
          notes: args.notes as string | undefined,
          tags: args.tags as string[] | undefined,
          createdBy: context.userId,
        });

        const e = result.entry;
        return {
          message: `Lançamento criado com sucesso.`,
          entry: {
            id: e.id,
            code: e.code,
            type: e.type,
            description: e.description,
            status: e.status,
            expectedAmount: e.expectedAmount,
            dueDate: e.dueDate,
          },
          installments: result.installments?.length
            ? result.installments.map((i) => ({
                id: i.id,
                code: i.code,
                currentInstallment: i.currentInstallment,
                dueDate: i.dueDate,
                expectedAmount: i.expectedAmount,
              }))
            : undefined,
        };
      },
    },

    finance_register_payment: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeRegisterPaymentUseCase();
        const result = await useCase.execute({
          entryId: args.entryId as string,
          tenantId: context.tenantId,
          amount: args.amount as number,
          paidAt: args.paidAt ? new Date(args.paidAt as string) : new Date(),
          bankAccountId: args.bankAccountId as string | undefined,
          method: args.method as string | undefined,
          notes: args.notes as string | undefined,
          createdBy: context.userId,
        });

        return {
          message: `Pagamento de R$ ${result.payment.amount.toFixed(2)} registrado com sucesso.`,
          entry: {
            id: result.entry.id,
            code: result.entry.code,
            status: result.entry.status,
            remainingBalance: result.entry.remainingBalance,
          },
          payment: {
            id: result.payment.id,
            amount: result.payment.amount,
            paidAt: result.payment.paidAt,
            method: result.payment.method,
          },
          nextOccurrence: result.nextOccurrence
            ? {
                id: result.nextOccurrence.id,
                code: result.nextOccurrence.code,
                dueDate: result.nextOccurrence.dueDate,
                expectedAmount: result.nextOccurrence.expectedAmount,
              }
            : undefined,
        };
      },
    },

    finance_cancel_entry: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCancelFinanceEntryUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          id: args.entryId as string,
          userId: context.userId,
        });

        return {
          message: 'Lançamento cancelado com sucesso.',
          entry: {
            id: result.entry.id,
            code: result.entry.code,
            description: result.entry.description,
            status: result.entry.status,
          },
        };
      },
    },

    finance_create_cost_center: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateCostCenterUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          code: args.code as string,
          name: args.name as string,
          description: args.description as string | undefined,
          parentId: args.parentId as string | undefined,
          monthlyBudget: args.monthlyBudget as number | undefined,
          annualBudget: args.annualBudget as number | undefined,
        });

        return {
          message: 'Centro de custo criado com sucesso.',
          costCenter: {
            id: result.costCenter.id,
            code: result.costCenter.code,
            name: result.costCenter.name,
            isActive: result.costCenter.isActive,
          },
        };
      },
    },

    finance_create_bank_account: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateBankAccountUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          bankCode: args.bankCode as string,
          bankName: args.bankName as string | undefined,
          agency: args.agency as string,
          accountNumber: args.accountNumber as string,
          accountType: args.accountType as string,
          pixKeyType: args.pixKeyType as string | undefined,
          pixKey: args.pixKey as string | undefined,
          color: args.color as string | undefined,
          isDefault: args.isDefault as boolean | undefined,
        });

        return {
          message: 'Conta bancária criada com sucesso.',
          bankAccount: {
            id: result.bankAccount.id,
            name: result.bankAccount.name,
            bankCode: result.bankAccount.bankCode,
            agency: result.bankAccount.agency,
            accountNumber: result.bankAccount.accountNumber,
            accountType: result.bankAccount.accountType,
          },
        };
      },
    },

    finance_create_category: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCreateFinanceCategoryUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          name: args.name as string,
          type: args.type as string,
          description: args.description as string | undefined,
          color: args.color as string | undefined,
          parentId: args.parentId as string | undefined,
        });

        return {
          message: 'Categoria financeira criada com sucesso.',
          category: {
            id: result.category.id,
            name: result.category.name,
            slug: result.category.slug,
            type: result.category.type,
          },
        };
      },
    },

    // =========================================================
    // REPORT TOOLS (3)
    // =========================================================

    finance_dashboard: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeGetFinanceDashboardUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
        });

        return {
          totalPayable: result.totalPayable,
          totalReceivable: result.totalReceivable,
          overduePayable: result.overduePayable,
          overdueReceivable: result.overdueReceivable,
          overduePayableCount: result.overduePayableCount,
          overdueReceivableCount: result.overdueReceivableCount,
          paidThisMonth: result.paidThisMonth,
          receivedThisMonth: result.receivedThisMonth,
          upcomingPayable7Days: result.upcomingPayable7Days,
          upcomingReceivable7Days: result.upcomingReceivable7Days,
          cashBalance: result.cashBalance,
          statusCounts: result.statusCounts,
          topOverdueReceivables: result.topOverdueReceivables?.slice(0, 5),
          topOverduePayables: result.topOverduePayables?.slice(0, 5),
        };
      },
    },

    finance_cashflow: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const startDate = parseDate(args.startDate);
        const endDate = parseDate(args.endDate);

        if (!startDate || !endDate) {
          return { error: 'Informe startDate e endDate válidos (ISO 8601).' };
        }

        const useCase = makeGetCashflowUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          startDate,
          endDate,
          groupBy: (args.groupBy as 'day' | 'week' | 'month') ?? 'month',
          bankAccountId: args.bankAccountId as string | undefined,
        });

        return {
          summary: result.summary,
          data: result.data.slice(0, TOOL_LIST_MAX_ITEMS).map((d) => ({
            date: d.date,
            inflow: d.inflow,
            outflow: d.outflow,
            net: d.net,
            cumulativeBalance: d.cumulativeBalance,
          })),
        };
      },
    },

    finance_overdue_report: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeCheckOverdueEntriesUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
          dueSoonDays: (args.dueSoonDays as number) ?? 3,
          createdBy: context.userId,
        });

        return {
          markedOverdue: result.markedOverdue,
          payableOverdue: result.payableOverdue,
          receivableOverdue: result.receivableOverdue,
          dueSoonAlerts: result.dueSoonAlerts,
        };
      },
    },
  };
}
