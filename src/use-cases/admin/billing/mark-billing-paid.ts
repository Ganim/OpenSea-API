import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import {
  type TenantBillingDTO,
  tenantBillingToDTO,
} from '@/mappers/core/tenant-billing-mapper';
import type { TenantBillingsRepository } from '@/repositories/core/tenant-billings-repository';

interface MarkBillingPaidUseCaseRequest {
  billingId: string;
  paymentMethod: string;
}

interface MarkBillingPaidUseCaseResponse {
  billing: TenantBillingDTO;
}

export class MarkBillingPaidUseCase {
  constructor(private tenantBillingsRepository: TenantBillingsRepository) {}

  async execute({
    billingId,
    paymentMethod,
  }: MarkBillingPaidUseCaseRequest): Promise<MarkBillingPaidUseCaseResponse> {
    // Find the billing by iterating through all statuses
    const pendingBillings =
      await this.tenantBillingsRepository.findByStatus('PENDING');
    const overdueBillings =
      await this.tenantBillingsRepository.findByStatus('OVERDUE');

    const allBillings = [...pendingBillings, ...overdueBillings];
    const billing = allBillings.find(
      (b) => b.tenantBillingId.toString() === billingId,
    );

    if (!billing) {
      throw new ResourceNotFoundError('Billing record not found');
    }

    billing.status = 'PAID';
    billing.paidAt = new Date();
    billing.paymentMethod = paymentMethod;

    await this.tenantBillingsRepository.save(billing);

    return {
      billing: tenantBillingToDTO(billing),
    };
  }
}
