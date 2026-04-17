import { describe, expect, it } from 'vitest';

import { makeBankAccount } from './make-bank-account';
import { makeConsortium } from './make-consortium';
import { makeFinanceEntry } from './make-finance-entry';
import { makeLoan } from './make-loan';
import { makeRecurringConfig } from './make-recurring-config';

/**
 * P3-25: Contract tests for the finance factories. They do not exercise
 * business behavior — they just guard the minimum invariants each
 * factory promises so consumers can rely on them in higher-level specs.
 */
describe('finance factories (P3-25)', () => {
  describe('makeFinanceEntry', () => {
    it('produces a valid CreateFinanceEntrySchema with all required fields populated', () => {
      const financeEntry = makeFinanceEntry();

      expect(financeEntry.tenantId).toBeTruthy();
      expect(['PAYABLE', 'RECEIVABLE']).toContain(financeEntry.type);
      expect(financeEntry.code).toMatch(/^FIN-/);
      expect(financeEntry.description).toBeTruthy();
      expect(financeEntry.categoryId).toBeTruthy();
      expect(financeEntry.expectedAmount).toBeGreaterThan(0);
      expect(financeEntry.issueDate).toBeInstanceOf(Date);
      expect(financeEntry.dueDate).toBeInstanceOf(Date);
      expect(financeEntry.status).toBe('PENDING');
      expect(financeEntry.recurrenceType).toBe('SINGLE');
      expect(financeEntry.discount).toBe(0);
      expect(financeEntry.metadata).toEqual({});
      expect(financeEntry.tags).toEqual([]);
    });

    it('honors field overrides without leaking defaults', () => {
      const financeEntry = makeFinanceEntry({
        tenantId: 'fixed-tenant',
        type: 'PAYABLE',
        expectedAmount: 999.5,
        status: 'OVERDUE',
        tags: ['urgent'],
      });

      expect(financeEntry.tenantId).toBe('fixed-tenant');
      expect(financeEntry.type).toBe('PAYABLE');
      expect(financeEntry.expectedAmount).toBe(999.5);
      expect(financeEntry.status).toBe('OVERDUE');
      expect(financeEntry.tags).toEqual(['urgent']);
    });
  });

  describe('makeLoan', () => {
    it('produces a coherent Loan where outstandingBalance <= principalAmount', () => {
      const loan = makeLoan();

      expect(loan.principalAmount).toBeGreaterThan(0);
      expect(loan.outstandingBalance).toBeLessThanOrEqual(loan.principalAmount);
      expect(loan.totalInstallments).toBeGreaterThan(0);
      expect(loan.paidInstallments).toBe(0);
      expect(loan.startDate).toBeInstanceOf(Date);
    });

    it('respects overrides even when they violate the default invariant', () => {
      const loan = makeLoan({
        principalAmount: 1000,
        outstandingBalance: 1000,
        type: 'FINANCING',
      });

      expect(loan.principalAmount).toBe(1000);
      expect(loan.outstandingBalance).toBe(1000);
      expect(loan.type).toBe('FINANCING');
    });
  });

  describe('makeConsortium', () => {
    it('produces default values where monthlyPayment > 0 and totals coherent', () => {
      const consortium = makeConsortium();

      expect(consortium.creditValue).toBeGreaterThan(0);
      expect(consortium.monthlyPayment).toBeGreaterThan(0);
      expect(consortium.totalInstallments).toBeGreaterThanOrEqual(48);
      expect(consortium.isContemplated).toBe(false);
      expect(consortium.paidInstallments).toBe(0);
    });
  });

  describe('makeBankAccount', () => {
    it('defaults to a real Brazilian bank code', () => {
      const bankAccount = makeBankAccount();

      expect(bankAccount.bankCode).toMatch(/^\d{3}$/);
      expect(bankAccount.agency).toMatch(/^\d{4}$/);
      expect(['CHECKING', 'SAVINGS']).toContain(bankAccount.accountType);
      expect(bankAccount.isDefault).toBe(false);
      expect(bankAccount.apiEnabled).toBe(false);
    });
  });

  describe('makeRecurringConfig', () => {
    it('produces a valid recurring config with nextDueDate aligned with startDate', () => {
      const recurringConfig = makeRecurringConfig();

      expect(['PAYABLE', 'RECEIVABLE']).toContain(recurringConfig.type);
      expect(recurringConfig.frequencyInterval).toBe(1);
      expect(recurringConfig.startDate).toBeInstanceOf(Date);
      expect(recurringConfig.expectedAmount).toBeGreaterThan(0);
      expect(recurringConfig.nextDueDate).toEqual(recurringConfig.startDate);
      expect(recurringConfig.isVariable).toBe(false);
    });
  });
});
