import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TransactionClient } from '@/lib/transaction-manager';
import type {
  BankPaymentMethod,
  PaymentOrderStatus,
} from '@prisma/generated/client.js';

export interface PaymentOrderRecord {
  id: string;
  tenantId: string;
  entryId: string;
  bankAccountId: string;
  method: BankPaymentMethod;
  amount: number;
  recipientData: Record<string, unknown>;
  status: PaymentOrderStatus;
  requestedById: string;
  approvedById: string | null;
  approvedAt: Date | null;
  rejectedReason: string | null;
  externalId: string | null;
  receiptData: Record<string, unknown> | null;
  receiptFileId: string | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentOrderData {
  tenantId: string;
  entryId: string;
  bankAccountId: string;
  method: BankPaymentMethod;
  amount: number;
  recipientData: Record<string, unknown>;
  requestedById: string;
}

export interface UpdatePaymentOrderData {
  id: UniqueEntityID;
  tenantId: string;
  /**
   * Optional compare-and-swap guard. When provided, the update only applies
   * if the current row still has this status. Used to serialize concurrent
   * approvers: if two requests race to mark PENDING_APPROVAL → APPROVED,
   * only one wins; the loser receives `null` and must abort.
   */
  expectedStatus?: PaymentOrderStatus;
  status?: PaymentOrderStatus;
  approvedById?: string;
  approvedAt?: Date;
  rejectedReason?: string;
  externalId?: string;
  receiptData?: Record<string, unknown>;
  receiptFileId?: string;
  errorMessage?: string;
}

export interface PaymentOrdersRepository {
  create(data: CreatePaymentOrderData): Promise<PaymentOrderRecord>;
  findById(
    id: UniqueEntityID,
    tenantId: string,
    tx?: TransactionClient,
  ): Promise<PaymentOrderRecord | null>;
  findByEntryId(
    entryId: string,
    tenantId: string,
  ): Promise<PaymentOrderRecord[]>;
  findMany(
    tenantId: string,
    options?: {
      status?: PaymentOrderStatus;
      page?: number;
      limit?: number;
    },
  ): Promise<{ orders: PaymentOrderRecord[]; total: number }>;
  update(
    data: UpdatePaymentOrderData,
    tx?: TransactionClient,
  ): Promise<PaymentOrderRecord | null>;
}
