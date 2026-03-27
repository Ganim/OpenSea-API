import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import type { FinanceEntry } from '@/entities/finance/finance-entry';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerPortalAccessesRepository } from '@/repositories/finance/customer-portal-accesses-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GetPortalInvoiceRequest {
  token: string;
  invoiceId: string;
}

interface GetPortalInvoiceResponse {
  invoice: FinanceEntry;
  customerName: string;
}

export class GetPortalInvoiceUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GetPortalInvoiceRequest,
  ): Promise<GetPortalInvoiceResponse> {
    const { token, invoiceId } = request;

    const access =
      await this.customerPortalAccessesRepository.findByToken(token);

    if (!access) {
      throw new UnauthorizedError('Token de acesso inválido.');
    }

    if (!access.isActive) {
      throw new UnauthorizedError('Acesso ao portal desativado.');
    }

    if (access.expiresAt && access.expiresAt < new Date()) {
      throw new UnauthorizedError('Token de acesso expirado.');
    }

    await this.customerPortalAccessesRepository.updateLastAccess(access.id);

    const invoice = await this.financeEntriesRepository.findById(
      new UniqueEntityID(invoiceId),
      access.tenantId,
    );

    if (!invoice) {
      throw new ResourceNotFoundError('Fatura não encontrada.');
    }

    // Ensure this invoice belongs to the portal customer
    if (invoice.type !== 'RECEIVABLE') {
      throw new ResourceNotFoundError('Fatura não encontrada.');
    }

    const invoiceCustomerName = invoice.customerName?.toLowerCase();
    const accessCustomerName = access.customerName?.toLowerCase();

    if (accessCustomerName && invoiceCustomerName !== accessCustomerName) {
      throw new ResourceNotFoundError('Fatura não encontrada.');
    }

    return {
      invoice,
      customerName: access.customerName ?? access.customerId,
    };
  }
}
