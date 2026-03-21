import { TenantBilling } from '@/entities/core/tenant-billing';
import {
  type TenantBillingDTO,
  tenantBillingToDTO,
} from '@/mappers/core/tenant-billing-mapper';
import type { TenantBillingsRepository } from '@/repositories/core/tenant-billings-repository';

interface GenerateBillingUseCaseRequest {
  tenantId: string;
  referenceMonth: string; // YYYY-MM
  subscriptionTotal: number;
  consumptionTotal: number;
  discountsTotal?: number;
  dueDate: Date;
  lineItems?: unknown[];
  notes?: string;
}

interface GenerateBillingUseCaseResponse {
  billing: TenantBillingDTO;
}

export class GenerateBillingUseCase {
  constructor(private tenantBillingsRepository: TenantBillingsRepository) {}

  async execute({
    tenantId,
    referenceMonth,
    subscriptionTotal,
    consumptionTotal,
    discountsTotal = 0,
    dueDate,
    lineItems = [],
    notes,
  }: GenerateBillingUseCaseRequest): Promise<GenerateBillingUseCaseResponse> {
    // Check if billing for this period already exists
    const existingBilling =
      await this.tenantBillingsRepository.findByTenantAndPeriod(
        tenantId,
        referenceMonth,
      );

    if (existingBilling) {
      throw new Error(
        `Billing for tenant ${tenantId} period ${referenceMonth} already exists`,
      );
    }

    const totalAmount = subscriptionTotal + consumptionTotal - discountsTotal;

    const billing = TenantBilling.create({
      tenantId,
      period: referenceMonth,
      subscriptionTotal,
      consumptionTotal,
      discountsTotal,
      totalAmount,
      dueDate,
      lineItems,
      notes: notes ?? null,
    });

    await this.tenantBillingsRepository.create(billing);

    return {
      billing: tenantBillingToDTO(billing),
    };
  }
}
