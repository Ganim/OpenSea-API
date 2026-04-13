import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InvoiceStatus } from '@/entities/sales/invoice';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import type { CompaniesRepository } from '@/repositories/core/companies-repository';
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';
import type { InvoicesRepository } from '@/repositories/sales/invoices-repository';

interface CancelInvoiceUseCaseRequest {
  invoiceId: string;
  tenantId: string;
  reason: string;
  userId: string;
}

interface CancelInvoiceUseCaseResponse {
  invoiceId: string;
  status: InvoiceStatus;
  cancelledAt: Date;
  cancelReason: string;
}

export class CancelInvoiceUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private focusNfeProvider: IFocusNfeProvider,
    private focusNfeConfigRepository: FocusNfeConfigRepository,
    private companiesRepository: CompaniesRepository,
  ) {}

  async execute(
    request: CancelInvoiceUseCaseRequest,
  ): Promise<CancelInvoiceUseCaseResponse> {
    // Busca Invoice
    const invoice = await this.invoicesRepository.findById(
      new UniqueEntityID(request.invoiceId),
      request.tenantId,
    );

    if (!invoice) {
      throw new ResourceNotFoundError('Invoice not found.');
    }

    // Valida que está em status ISSUED
    if (invoice.status !== 'ISSUED') {
      throw new BadRequestError(
        `Cannot cancel invoice with status ${invoice.status}. Only ISSUED invoices can be cancelled.`,
      );
    }

    // Busca config Focus NFe do tenant
    const config = await this.focusNfeConfigRepository.findByTenant(
      request.tenantId,
    );
    if (!config || !config.isEnabled) {
      throw new BadRequestError(
        'Focus NFe is not configured or disabled for this tenant.',
      );
    }

    const companies = await this.companiesRepository.findManyActive(
      request.tenantId,
    );
    const company = companies[0];
    if (!company) {
      throw new BadRequestError('Nenhuma empresa cadastrada para este tenant.');
    }

    // Chama provider para cancelar
    try {
      await this.focusNfeProvider.cancelInvoice({
        type: invoice.type.toLowerCase() as 'nfe' | 'nfce',
        apiKey: config.apiKey,
        ref: invoice.id.toString(),
        numero_nf: Number(invoice.number),
        serie_nf: Number(invoice.series),
        chave_nfe: invoice.accessKey,
        cnpj_emitente: company.cnpj,
        data_emissao:
          invoice.issuedAt?.toISOString().split('T')[0] ||
          new Date().toISOString().split('T')[0],
        justificativa: request.reason,
      });
    } catch (error) {
      throw new Error(
        `Failed to cancel invoice via Focus NFe: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Marca como cancelada
    invoice.markAsCancelled(request.reason);

    // Persiste
    await this.invoicesRepository.save(invoice);

    // TODO: Emitir InvoiceCancelledEvent
    // TODO: Atualizar Order status para INVOICE_CANCELLED

    return {
      invoiceId: invoice.id.toString(),
      status: invoice.status,
      cancelledAt: invoice.cancelledAt!,
      cancelReason: invoice.cancelReason!,
    };
  }
}
