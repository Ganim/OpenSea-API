export type FinanceEntryType = 'PAYABLE' | 'RECEIVABLE';

export type FinanceEntryStatus =
  | 'PENDING'
  | 'OVERDUE'
  | 'PAID'
  | 'RECEIVED'
  | 'PARTIALLY_PAID'
  | 'CANCELLED'
  | 'SCHEDULED';

export type RecurrenceType = 'SINGLE' | 'RECURRING' | 'INSTALLMENT';

export type RecurrenceUnit =
  | 'DAILY'
  | 'WEEKLY'
  | 'BIWEEKLY'
  | 'MONTHLY'
  | 'QUARTERLY'
  | 'SEMIANNUAL'
  | 'ANNUAL';

export type PaymentMethod =
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'BANK_TRANSFER'
  | 'PIX'
  | 'BOLETO'
  | 'CHECK'
  | 'OTHER';

export type RecurringConfigStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED';

export type LoanType =
  | 'PERSONAL'
  | 'BUSINESS'
  | 'WORKING_CAPITAL'
  | 'EQUIPMENT'
  | 'REAL_ESTATE'
  | 'CREDIT_LINE'
  | 'OTHER';

export type LoanStatus =
  | 'ACTIVE'
  | 'PAID_OFF'
  | 'DEFAULTED'
  | 'RENEGOTIATED'
  | 'CANCELLED';

export type ConsortiumStatus =
  | 'ACTIVE'
  | 'CONTEMPLATED'
  | 'WITHDRAWN'
  | 'COMPLETED'
  | 'CANCELLED';

export type ContemplationType = 'BID' | 'DRAW';

export type InstallmentStatus = 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export type ContractStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'RENEWED'
  | 'CANCELLED';
