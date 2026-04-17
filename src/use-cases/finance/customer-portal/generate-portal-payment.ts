import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { PixCode } from '@/entities/finance/value-objects/pix-code';
import type { CompaniesRepository } from '@/repositories/core/companies-repository';
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
    private companiesRepository?: CompaniesRepository,
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

    let pixCopiaECola: string | null = null;
    const pixKey = method === 'PIX' ? (invoice.pixKey ?? null) : null;

    if (method === 'PIX' && pixKey) {
      let merchantName = 'RECEBEDOR';
      if (invoice.companyId && this.companiesRepository) {
        const company = await this.companiesRepository.findById(
          invoice.companyId,
          access.tenantId,
        );
        if (company) {
          merchantName = company.tradeName || company.legalName || merchantName;
        }
      }

      pixCopiaECola = PixCode.buildEmv({
        pixKey,
        merchantName,
        merchantCity: 'SAO PAULO',
        amount: invoice.expectedAmount,
        txId: invoice.id.toString().replace(/-/g, '').slice(0, 25),
      });
    }

    return {
      invoiceId: invoice.id.toString(),
      method,
      amount: invoice.expectedAmount,
      pixCopiaECola,
      pixKey,
      boletoDigitableLine:
        method === 'BOLETO' ? (invoice.boletoDigitableLine ?? null) : null,
      boletoPdfUrl: method === 'BOLETO' ? (invoice.boletoPdfUrl ?? null) : null,
    };
  }
}
