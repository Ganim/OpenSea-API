import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InvoiceStatus } from '@/entities/sales/invoice';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
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

    // Chama provider para cancelar
    try {
      await this.focusNfeProvider.cancelInvoice({
        type: invoice.type.toLowerCase() as 'nfe' | 'nfce',
        apiKey: '', // TODO: passar API key do config
        ref: invoice.id.toString(),
        numero_nf: Number(invoice.number),
        serie_nf: Number(invoice.series),
        chave_nfe: invoice.accessKey,
        cnpj_emitente: '', // TODO: buscar do company
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
