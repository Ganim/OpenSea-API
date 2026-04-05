import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InvoicesRepository } from '@/repositories/sales/invoices-repository';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';

interface CheckInvoiceStatusUseCaseRequest {
  invoiceId: string;
  tenantId: string;
}

interface CheckInvoiceStatusUseCaseResponse {
  invoiceId: string;
  status: string;
  statusDetails?: string;
  accessKey: string;
  xmlUrl?: string;
  pdfUrl?: string;
  updatedAt: Date;
}

export class CheckInvoiceStatusUseCase {
  constructor(
    private invoicesRepository: InvoicesRepository,
    private focusNfeProvider: IFocusNfeProvider,
  ) {}

  async execute(
    request: CheckInvoiceStatusUseCaseRequest,
  ): Promise<CheckInvoiceStatusUseCaseResponse> {
    // Busca Invoice
    const invoice = await this.invoicesRepository.findById(
      new UniqueEntityID(request.invoiceId),
      request.tenantId,
    );

    if (!invoice) {
      throw new ResourceNotFoundError('Invoice not found.');
    }

    // Se for PENDING ou ERROR, tenta query o status via provider
    if (invoice.status === 'PENDING' || invoice.status === 'ERROR') {
      try {
        const statusResponse = await this.focusNfeProvider.checkStatus({
          type: invoice.type.toLowerCase() as 'nfe' | 'nfce',
          apiKey: '', // TODO: passar API key do config
          ref: invoice.id.toString(),
        });

        // Atualiza status se mudou
        if (statusResponse.status !== invoice.status) {
          invoice.status = statusResponse.status as any;
          invoice.statusDetails = statusResponse.descricao_status;
          if (statusResponse.status === 'autorizado' || statusResponse.status === 'processando_digitacao') {
            invoice.markAsIssued(
              statusResponse.chave_nfe || invoice.accessKey,
              statusResponse.protocolo,
              statusResponse.caminho_xml,
              statusResponse.caminho_pdf,
            );
          }
          await this.invoicesRepository.save(invoice);
        }
      } catch {
        // Se falhar query, apenas retorna status atual
      }
    }

    return {
      invoiceId: invoice.id.toString(),
      status: invoice.status,
      statusDetails: invoice.statusDetails,
      accessKey: invoice.accessKey,
      xmlUrl: invoice.xmlUrl,
      pdfUrl: invoice.pdfUrl,
      updatedAt: invoice.updatedAt || invoice.createdAt,
    };
  }
}
