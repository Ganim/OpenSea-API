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
import { makeGetForecastUseCase } from '@/use-cases/finance/dashboard/factories/make-get-forecast-use-case';

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

    // =========================================================
    // ADVANCED ANALYTICAL TOOLS (8)
    // =========================================================

    finance_get_summary: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const period = (args.period as string) ?? 'month';
        const now = new Date();
        let startDate: Date;
        let endDate: Date;

        switch (period) {
          case 'today':
            startDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
              ),
            );
            endDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate(),
                23,
                59,
                59,
              ),
            );
            break;
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            endDate = now;
            break;
          case 'quarter': {
            const quarterMonth = Math.floor(now.getUTCMonth() / 3) * 3;
            startDate = new Date(
              Date.UTC(now.getUTCFullYear(), quarterMonth, 1),
            );
            endDate = new Date(
              Date.UTC(now.getUTCFullYear(), quarterMonth + 3, 0, 23, 59, 59),
            );
            break;
          }
          case 'year':
            startDate = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));
            endDate = new Date(
              Date.UTC(now.getUTCFullYear(), 11, 31, 23, 59, 59),
            );
            break;
          default:
            // month
            startDate = new Date(
              Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
            );
            endDate = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth() + 1,
                0,
                23,
                59,
                59,
              ),
            );
        }

        const dashboardUseCase = makeGetFinanceDashboardUseCase();
        const dashboard = await dashboardUseCase.execute({
          tenantId: context.tenantId,
        });

        const forecastUseCase = makeGetForecastUseCase();
        const forecast = await forecastUseCase.execute({
          tenantId: context.tenantId,
          startDate,
          endDate,
          groupBy: 'month',
        });

        return {
          period,
          periodLabel: {
            today: 'Hoje',
            week: 'Últimos 7 dias',
            month: 'Mês atual',
            quarter: 'Trimestre atual',
            year: 'Ano atual',
          }[period],
          totalPayablePending: dashboard.totalPayable,
          totalReceivablePending: dashboard.totalReceivable,
          totalOverdue: dashboard.overduePayable + dashboard.overdueReceivable,
          overduePayable: dashboard.overduePayable,
          overdueReceivable: dashboard.overdueReceivable,
          paidThisPeriod: forecast.totals.totalPayable,
          receivedThisPeriod: forecast.totals.totalReceivable,
          cashBalance: dashboard.cashBalance,
          netBalance: forecast.totals.netBalance,
          overduePayableCount: dashboard.overduePayableCount,
          overdueReceivableCount: dashboard.overdueReceivableCount,
        };
      },
    },

    finance_list_overdue_entries: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const type = args.type as string | undefined;
        const limit = clampLimit(args.limit);
        const now = new Date();

        // Fetch overdue entries (status PENDING/PARTIAL with dueDate < now)
        const listUseCase = makeListFinanceEntriesUseCase();
        const result = await listUseCase.execute({
          tenantId: context.tenantId,
          type,
          isOverdue: true,
          page: 1,
          limit,
          sortBy: 'dueDate',
          sortOrder: 'asc',
        });

        const entries = result.entries
          .slice(0, TOOL_LIST_MAX_ITEMS)
          .map((e) => {
            const daysOverdue = Math.floor(
              (now.getTime() - new Date(e.dueDate).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            return {
              id: e.id,
              code: e.code,
              type: e.type,
              name: e.type === 'RECEIVABLE' ? e.customerName : e.supplierName,
              description: e.description?.slice(0, 80),
              amount: e.remainingBalance ?? e.expectedAmount,
              dueDate: e.dueDate,
              daysOverdue: Math.max(0, daysOverdue),
            };
          })
          .sort((a, b) => b.daysOverdue - a.daysOverdue);

        const totalOverdueAmount = entries.reduce(
          (sum, e) => sum + e.amount,
          0,
        );

        return {
          total: result.meta.total,
          showing: entries.length,
          totalOverdueAmount,
          entries,
        };
      },
    },

    finance_get_cashflow_forecast: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const days = Math.min(Math.max(1, (args.days as number) ?? 30), 180);
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const cashflowUseCase = makeGetCashflowUseCase();
        const cashflow = await cashflowUseCase.execute({
          tenantId: context.tenantId,
          startDate: now,
          endDate,
          groupBy: days <= 14 ? 'day' : days <= 60 ? 'week' : 'month',
        });

        const projectedBalance = cashflow.summary.closingBalance;
        const alert =
          projectedBalance < 0
            ? `ALERTA: Saldo projetado negativo de R$ ${Math.abs(projectedBalance).toFixed(2)} em ${days} dias. Revise pagamentos ou antecipe recebíveis.`
            : null;

        return {
          days,
          currentBalance: cashflow.summary.openingBalance,
          projectedIncome: cashflow.summary.totalInflow,
          projectedExpenses: cashflow.summary.totalOutflow,
          projectedBalance,
          netFlow: cashflow.summary.netFlow,
          alert,
          timeline: cashflow.data.slice(0, TOOL_LIST_MAX_ITEMS).map((d) => ({
            date: d.date,
            inflow: d.inflow,
            outflow: d.outflow,
            net: d.net,
            balance: d.cumulativeBalance,
          })),
        };
      },
    },

    finance_compare_expenses: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const period1Str = args.period1 as string;
        const period2Str = args.period2 as string;

        if (!period1Str || !period2Str) {
          return {
            error:
              'Informe period1 e period2 no formato YYYY-MM (ex: 2026-01).',
          };
        }

        const [y1, m1] = period1Str.split('-').map(Number);
        const [y2, m2] = period2Str.split('-').map(Number);

        const start1 = new Date(Date.UTC(y1, m1 - 1, 1));
        const end1 = new Date(Date.UTC(y1, m1, 0, 23, 59, 59));
        const start2 = new Date(Date.UTC(y2, m2 - 1, 1));
        const end2 = new Date(Date.UTC(y2, m2, 0, 23, 59, 59));

        const forecastUseCase = makeGetForecastUseCase();

        const [result1, result2] = await Promise.all([
          forecastUseCase.execute({
            tenantId: context.tenantId,
            type: 'PAYABLE',
            startDate: start1,
            endDate: end1,
            groupBy: 'month',
          }),
          forecastUseCase.execute({
            tenantId: context.tenantId,
            type: 'PAYABLE',
            startDate: start2,
            endDate: end2,
            groupBy: 'month',
          }),
        ]);

        const total1 = result1.totals.totalPayable;
        const total2 = result2.totals.totalPayable;
        const difference = total2 - total1;
        const percentChange =
          total1 > 0 ? ((difference / total1) * 100).toFixed(1) : null;

        // Build category comparison
        const cat1Map = new Map(
          result1.byCategory.map((c) => [c.categoryId, c]),
        );
        const cat2Map = new Map(
          result2.byCategory.map((c) => [c.categoryId, c]),
        );
        const allCatIds = new Set([...cat1Map.keys(), ...cat2Map.keys()]);

        const categoryComparison = Array.from(allCatIds)
          .map((catId) => {
            const c1 = cat1Map.get(catId);
            const c2 = cat2Map.get(catId);
            const v1 = c1?.total ?? 0;
            const v2 = c2?.total ?? 0;
            const diff = v2 - v1;
            const pct = v1 > 0 ? ((diff / v1) * 100).toFixed(1) : null;
            return {
              categoryId: catId,
              categoryName: c2?.categoryName ?? c1?.categoryName ?? 'N/A',
              period1Total: v1,
              period2Total: v2,
              difference: diff,
              percentChange: pct,
            };
          })
          .sort((a, b) => Math.abs(b.difference) - Math.abs(a.difference))
          .slice(0, 10);

        const increasedCategories = categoryComparison.filter(
          (c) => c.percentChange !== null && parseFloat(c.percentChange) > 20,
        );

        return {
          period1: period1Str,
          period2: period2Str,
          period1Total: total1,
          period2Total: total2,
          difference,
          percentChange,
          direction:
            difference > 0 ? 'AUMENTO' : difference < 0 ? 'REDUÇÃO' : 'ESTÁVEL',
          topCategories: categoryComparison,
          categoriesWithSignificantIncrease: increasedCategories,
        };
      },
    },

    finance_get_customer_payment_score: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const customerName = args.customerName as string;
        if (!customerName) {
          return { error: 'Informe o nome do cliente (customerName).' };
        }

        const listUseCase = makeListFinanceEntriesUseCase();

        // Get all receivable entries for this customer
        const result = await listUseCase.execute({
          tenantId: context.tenantId,
          type: 'RECEIVABLE',
          customerName,
          page: 1,
          limit: 200,
        });

        const entries = result.entries;

        if (entries.length === 0) {
          return {
            error: `Nenhum lançamento encontrado para o cliente "${customerName}".`,
            suggestion:
              'Verifique a grafia do nome ou tente com parte do nome.',
          };
        }

        // Calculate payment metrics
        const paidEntries = entries.filter(
          (e) => e.status === 'RECEIVED' || e.status === 'PAID',
        );
        const overdueEntries = entries.filter((e) => e.isOverdue);
        const totalEntries = entries.length;

        // Calculate average days to payment
        let totalDaysToPayment = 0;
        let entriesWithPaymentDate = 0;

        for (const e of paidEntries) {
          if (e.paymentDate && e.dueDate) {
            const due = new Date(e.dueDate).getTime();
            const paid = new Date(e.paymentDate).getTime();
            const daysToPayment = Math.floor(
              (paid - due) / (1000 * 60 * 60 * 24),
            );
            totalDaysToPayment += daysToPayment;
            entriesWithPaymentDate++;
          }
        }

        const avgDaysToPayment =
          entriesWithPaymentDate > 0
            ? Math.round(totalDaysToPayment / entriesWithPaymentDate)
            : null;

        // On-time rate: paid entries where paymentDate <= dueDate
        const onTimeCount = paidEntries.filter((e) => {
          if (!e.paymentDate || !e.dueDate) return false;
          return new Date(e.paymentDate) <= new Date(e.dueDate);
        }).length;

        const onTimeRate =
          paidEntries.length > 0
            ? Math.round((onTimeCount / paidEntries.length) * 100)
            : null;

        // Score: 0-100 based on on-time rate and overdue ratio
        let score = 50; // base
        if (onTimeRate !== null) {
          score = Math.round(onTimeRate * 0.7 + 30); // 30-100 range
        }
        if (overdueEntries.length > 0) {
          const overdueRatio = overdueEntries.length / totalEntries;
          score = Math.max(0, score - Math.round(overdueRatio * 40));
        }
        score = Math.min(100, Math.max(0, score));

        // Rating
        let rating: string;
        if (score >= 90) rating = 'EXCELENTE';
        else if (score >= 75) rating = 'BOM';
        else if (score >= 50) rating = 'REGULAR';
        else if (score >= 25) rating = 'RUIM';
        else rating = 'CRÍTICO';

        const totalReceivable = entries.reduce(
          (sum, e) => sum + e.expectedAmount,
          0,
        );
        const totalOverdue = overdueEntries.reduce(
          (sum, e) => sum + (e.remainingBalance ?? e.expectedAmount),
          0,
        );

        return {
          customerName: entries[0]?.customerName ?? customerName,
          score,
          rating,
          avgDaysToPayment,
          onTimeRate: onTimeRate !== null ? `${onTimeRate}%` : 'N/A',
          totalEntries,
          paidEntries: paidEntries.length,
          overdueEntries: overdueEntries.length,
          totalReceivable,
          totalOverdue,
        };
      },
    },

    finance_suggest_cost_reduction: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const months = Math.min(Math.max(1, (args.months as number) ?? 3), 12);
        const now = new Date();

        // Get category totals for each month in the lookback period
        const forecastUseCase = makeGetForecastUseCase();
        const monthlyResults = [];

        for (let i = 0; i < months; i++) {
          const monthStart = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
          );
          const monthEnd = new Date(
            Date.UTC(
              now.getUTCFullYear(),
              now.getUTCMonth() - i + 1,
              0,
              23,
              59,
              59,
            ),
          );
          const result = await forecastUseCase.execute({
            tenantId: context.tenantId,
            type: 'PAYABLE',
            startDate: monthStart,
            endDate: monthEnd,
            groupBy: 'month',
          });
          monthlyResults.push({
            month: `${monthStart.getUTCFullYear()}-${String(monthStart.getUTCMonth() + 1).padStart(2, '0')}`,
            total: result.totals.totalPayable,
            byCategory: result.byCategory,
          });
        }

        // Top 5 categories by total expense across all months
        const categoryTotals = new Map<
          string,
          { name: string; total: number; monthly: number[] }
        >();
        for (const mr of monthlyResults) {
          for (const cat of mr.byCategory) {
            const existing = categoryTotals.get(cat.categoryId) ?? {
              name: cat.categoryName,
              total: 0,
              monthly: [],
            };
            existing.total += cat.total;
            existing.monthly.push(cat.total);
            categoryTotals.set(cat.categoryId, existing);
          }
        }

        const topCategories = Array.from(categoryTotals.entries())
          .sort(([, a], [, b]) => b.total - a.total)
          .slice(0, 5)
          .map(([id, data]) => ({
            categoryId: id,
            categoryName: data.name,
            totalExpense: data.total,
            monthlyAverage: Math.round(data.total / months),
            monthlyValues: data.monthly,
          }));

        // Detect categories with >20% increase (compare most recent month vs previous)
        const categoriesWithIncrease: Array<{
          categoryId: string;
          categoryName: string;
          previousMonth: number;
          currentMonth: number;
          increasePercent: string;
        }> = [];

        if (monthlyResults.length >= 2) {
          const currentMonth = monthlyResults[0];
          const previousMonth = monthlyResults[1];
          const prevMap = new Map(
            previousMonth.byCategory.map((c) => [c.categoryId, c.total]),
          );

          for (const cat of currentMonth.byCategory) {
            const prev = prevMap.get(cat.categoryId) ?? 0;
            if (prev > 0) {
              const increase = ((cat.total - prev) / prev) * 100;
              if (increase > 20) {
                categoriesWithIncrease.push({
                  categoryId: cat.categoryId,
                  categoryName: cat.categoryName,
                  previousMonth: prev,
                  currentMonth: cat.total,
                  increasePercent: increase.toFixed(1),
                });
              }
            }
          }
        }

        // Month-over-month trend
        const monthlyTrend = monthlyResults
          .map((m) => ({
            month: m.month,
            total: m.total,
          }))
          .reverse(); // oldest first

        // Generate suggestions
        const suggestions: string[] = [];

        if (categoriesWithIncrease.length > 0) {
          for (const cat of categoriesWithIncrease.slice(0, 3)) {
            suggestions.push(
              `A categoria "${cat.categoryName}" aumentou ${cat.increasePercent}% em relação ao mês anterior (de R$ ${cat.previousMonth.toFixed(2)} para R$ ${cat.currentMonth.toFixed(2)}). Revise se há gastos desnecessários.`,
            );
          }
        }

        if (topCategories.length > 0) {
          suggestions.push(
            `As 3 maiores categorias de despesa são: ${topCategories
              .slice(0, 3)
              .map(
                (c) =>
                  `"${c.categoryName}" (média mensal: R$ ${c.monthlyAverage.toFixed(2)})`,
              )
              .join(', ')}. Negocie melhores condições ou busque alternativas.`,
          );
        }

        if (monthlyTrend.length >= 2) {
          const first = monthlyTrend[0].total;
          const last = monthlyTrend[monthlyTrend.length - 1].total;
          if (last > first * 1.1) {
            suggestions.push(
              `Despesas totais cresceram de R$ ${first.toFixed(2)} para R$ ${last.toFixed(2)} nos últimos ${months} meses. Considere estabelecer um teto orçamentário.`,
            );
          }
        }

        return {
          months,
          topCategories,
          monthlyTrend,
          categoriesWithSignificantIncrease: categoriesWithIncrease,
          suggestions,
        };
      },
    },

    finance_get_bank_account_balances: {
      async execute(
        _args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const useCase = makeListBankAccountsUseCase();
        const result = await useCase.execute({
          tenantId: context.tenantId,
        });

        const activeAccounts = result.bankAccounts.filter(
          (ba) => ba.status === 'ACTIVE',
        );

        const totalBalance = activeAccounts.reduce(
          (sum, ba) => sum + ba.currentBalance,
          0,
        );

        return {
          totalBalance,
          accountCount: activeAccounts.length,
          accounts: activeAccounts.map((ba) => ({
            id: ba.id,
            name: ba.name,
            bankName: ba.bankName,
            accountType: ba.accountType,
            currentBalance: ba.currentBalance,
            isDefault: ba.isDefault,
          })),
        };
      },
    },

    finance_get_upcoming_payments: {
      async execute(
        args: Record<string, unknown>,
        context: ToolExecutionContext,
      ) {
        const days = Math.min(Math.max(1, (args.days as number) ?? 7), 90);
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const listUseCase = makeListFinanceEntriesUseCase();
        const result = await listUseCase.execute({
          tenantId: context.tenantId,
          dueDateFrom: now,
          dueDateTo: endDate,
          status: 'PENDING',
          page: 1,
          limit: 50,
          sortBy: 'dueDate',
          sortOrder: 'asc',
        });

        // Group by day
        const groupedByDay = new Map<
          string,
          Array<{
            id: string;
            code: string;
            type: string;
            description: string;
            name: string | undefined;
            amount: number;
          }>
        >();

        for (const e of result.entries) {
          const dayKey = new Date(e.dueDate).toISOString().split('T')[0];
          const group = groupedByDay.get(dayKey) ?? [];
          group.push({
            id: e.id,
            code: e.code,
            type: e.type,
            description: (e.description ?? '').slice(0, 80),
            name: e.type === 'PAYABLE' ? e.supplierName : e.customerName,
            amount: e.remainingBalance ?? e.expectedAmount,
          });
          groupedByDay.set(dayKey, group);
        }

        const dailyGroups = Array.from(groupedByDay.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, TOOL_LIST_MAX_ITEMS)
          .map(([date, entries]) => ({
            date,
            count: entries.length,
            dayTotal: entries.reduce((s, e) => s + e.amount, 0),
            entries: entries.slice(0, 10),
          }));

        const grandTotal = result.entries.reduce(
          (sum, e) => sum + (e.remainingBalance ?? e.expectedAmount),
          0,
        );

        return {
          days,
          totalEntries: result.meta.total,
          grandTotal,
          dailyGroups,
        };
      },
    },
  };
}
