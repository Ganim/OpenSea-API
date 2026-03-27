import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CustomerPortalAccessesRepository } from '@/repositories/finance/customer-portal-accesses-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';

interface GeneratePortalPaymentRequest {
  token: string;
  invoiceId: string;
  method: 'PIX' | 'BOLETO';
}

interface GeneratePortalPaymentResponse {
  invoiceId: string;
  method: 'PIX' | 'BOLETO';
  amount: number;
  pixCopiaECola: string | null;
  pixKey: string | null;
  boletoDigitableLine: string | null;
  boletoPdfUrl: string | null;
}

export class GeneratePortalPaymentUseCase {
  constructor(
    private customerPortalAccessesRepository: CustomerPortalAccessesRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
  ) {}

  async execute(
    request: GeneratePortalPaymentRequest,
  ): Promise<GeneratePortalPaymentResponse> {
    const { token, invoiceId, method } = request;

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

    if (invoice.type !== 'RECEIVABLE') {
      throw new ResourceNotFoundError('Fatura não encontrada.');
    }

    const invoiceCustomerName = invoice.customerName?.toLowerCase();
    const accessCustomerName = access.customerName?.toLowerCase();

    if (accessCustomerName && invoiceCustomerName !== accessCustomerName) {
      throw new ResourceNotFoundError('Fatura não encontrada.');
    }

    const paidStatuses = ['PAID', 'RECEIVED'];
    if (paidStatuses.includes(invoice.status)) {
      throw new BadRequestError('Esta fatura já foi paga.');
    }

    // Return existing payment data from the invoice
    // In a real integration, this would call PIX/Boleto APIs
    return {
      invoiceId: invoice.id.toString(),
      method,
      amount: invoice.expectedAmount,
      pixCopiaECola: method === 'PIX' ? (invoice.pixKey ?? null) : null,
      pixKey: method === 'PIX' ? (invoice.pixKey ?? null) : null,
      boletoDigitableLine:
        method === 'BOLETO' ? (invoice.boletoDigitableLine ?? null) : null,
      boletoPdfUrl: method === 'BOLETO' ? (invoice.boletoPdfUrl ?? null) : null,
    };
  }
}
