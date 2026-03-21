import { TenantBilling } from '@/entities/core/tenant-billing';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { TenantBilling as PrismaTenantBilling } from '@prisma/generated/client';

export interface TenantBillingDTO {
  id: string;
  tenantId: string;
  period: string;
  subscriptionTotal: number;
  consumptionTotal: number;
  discountsTotal: number;
  totalAmount: number;
  status: string;
  dueDate: Date;
  paidAt: Date | null;
  paymentMethod: string | null;
  invoiceUrl: string | null;
  lineItems: unknown[];
  notes: string | null;
  createdAt: Date;
}

export function tenantBillingPrismaToDomain(
  raw: PrismaTenantBilling,
): TenantBilling {
  const lineItems = raw.lineItems as unknown[];
  const breakdown = extractBreakdownFromLineItems(lineItems);

  return TenantBilling.create(
    {
      id: new UniqueEntityID(raw.id),
      tenantId: raw.tenantId,
      period: raw.referenceMonth,
      subscriptionTotal: breakdown.subscriptionTotal,
      consumptionTotal: breakdown.consumptionTotal,
      discountsTotal: breakdown.discountsTotal,
      totalAmount: Number(raw.totalAmount),
      status: raw.status,
      dueDate: raw.dueDate,
      paidAt: raw.paidAt,
      paymentMethod: breakdown.paymentMethod,
      invoiceUrl: breakdown.invoiceUrl,
      lineItems,
      notes: breakdown.notes,
      createdAt: raw.createdAt,
    },
    new UniqueEntityID(raw.id),
  );
}

export function tenantBillingToDTO(billing: TenantBilling): TenantBillingDTO {
  return {
    id: billing.tenantBillingId.toString(),
    tenantId: billing.tenantId,
    period: billing.period,
    subscriptionTotal: billing.subscriptionTotal,
    consumptionTotal: billing.consumptionTotal,
    discountsTotal: billing.discountsTotal,
    totalAmount: billing.totalAmount,
    status: billing.status,
    dueDate: billing.dueDate,
    paidAt: billing.paidAt,
    paymentMethod: billing.paymentMethod,
    invoiceUrl: billing.invoiceUrl,
    lineItems: billing.lineItems,
    notes: billing.notes,
    createdAt: billing.createdAt,
  };
}

export function tenantBillingToPrisma(billing: TenantBilling) {
  return {
    id: billing.tenantBillingId.toString(),
    tenantId: billing.tenantId,
    referenceMonth: billing.period,
    totalAmount: billing.totalAmount,
    status: billing.status as PrismaTenantBilling['status'],
    dueDate: billing.dueDate,
    paidAt: billing.paidAt,
    lineItems: billing.lineItems,
  };
}

interface BillingBreakdown {
  subscriptionTotal: number;
  consumptionTotal: number;
  discountsTotal: number;
  paymentMethod: string | null;
  invoiceUrl: string | null;
  notes: string | null;
}

function extractBreakdownFromLineItems(lineItems: unknown[]): BillingBreakdown {
  let subscriptionTotal = 0;
  let consumptionTotal = 0;
  let discountsTotal = 0;
  let paymentMethod: string | null = null;
  let invoiceUrl: string | null = null;
  let notes: string | null = null;

  for (const item of lineItems) {
    if (typeof item !== 'object' || item === null) continue;
    const entry = item as Record<string, unknown>;

    if (entry.type === 'subscription' && typeof entry.amount === 'number') {
      subscriptionTotal += entry.amount;
    }
    if (entry.type === 'consumption' && typeof entry.amount === 'number') {
      consumptionTotal += entry.amount;
    }
    if (entry.type === 'discount' && typeof entry.amount === 'number') {
      discountsTotal += Math.abs(entry.amount);
    }
    if (entry.type === 'meta') {
      paymentMethod =
        typeof entry.paymentMethod === 'string'
          ? entry.paymentMethod
          : paymentMethod;
      invoiceUrl =
        typeof entry.invoiceUrl === 'string' ? entry.invoiceUrl : invoiceUrl;
      notes = typeof entry.notes === 'string' ? entry.notes : notes;
    }
  }

  return {
    subscriptionTotal,
    consumptionTotal,
    discountsTotal,
    paymentMethod,
    invoiceUrl,
    notes,
  };
}
