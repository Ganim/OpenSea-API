import type { TenantBilling } from '@/entities/core/tenant-billing';
import type { TenantConsumption } from '@/entities/core/tenant-consumption';
import type { TenantSubscription } from '@/entities/core/tenant-subscription';

export function presentTenantSubscription(subscription: TenantSubscription) {
  return {
    id: subscription.id.toString(),
    tenantId: subscription.tenantId,
    skillCode: subscription.skillCode,
    status: subscription.status,
    quantity: subscription.quantity,
    startsAt: subscription.startsAt,
    expiresAt: subscription.expiresAt,
    cancelledAt: subscription.cancelledAt,
    customPrice: subscription.customPrice,
    discountPercent: subscription.discountPercent,
    notes: subscription.notes,
    grantedBy: subscription.grantedBy,
    metadata: subscription.metadata,
    createdAt: subscription.createdAt,
    updatedAt: subscription.updatedAt,
  };
}

export function presentTenantConsumption(consumption: TenantConsumption) {
  return {
    id: consumption.id.toString(),
    tenantId: consumption.tenantId,
    period: consumption.period,
    metric: consumption.metric,
    quantity: consumption.quantity,
    limit: consumption.limit,
    used: consumption.used,
    included: consumption.included,
    overage: consumption.overage,
    overageCost: consumption.overageCost,
    createdAt: consumption.createdAt,
    updatedAt: consumption.updatedAt,
  };
}

export function presentTenantBilling(billing: TenantBilling) {
  return {
    id: billing.id.toString(),
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
