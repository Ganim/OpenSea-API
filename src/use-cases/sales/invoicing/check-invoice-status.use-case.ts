import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { InvoiceStatus } from '@/entities/sales/invoice';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import type { InvoicesRepository } from '@/repositories/sales/invoices-repository';

interface CheckInvoiceStatusUseCaseRequest {
  invoiceId: string;
  tenantId: string;
}

interface CheckInvoiceStatusUseCaseResponse {
  id: string;
  tenantId: string;
  orderId: string;
  type: 'NFE' | 'NFCE';
  number: string;
  series: string;
  accessKey: string;
  focusIdRef?: string;
  status: InvoiceStatus;
  statusDetails?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  issuedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

function mapProviderStatusToInvoiceStatus(
  status: string,
): InvoiceStatus | null {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus === 'autorizado' ||
    normalizedStatus === 'processando_digitacao'
  ) {
    return 'ISSUED';
  }

  if (normalizedStatus === 'cancelado') {
    return 'CANCELLED';
  }

  if (
    normalizedStatus === 'erro_autorizacao' ||
    normalizedStatus === 'rejeitado'
  ) {
    return 'ERROR';
  }

  if (normalizedStatus === 'processando' || normalizedStatus === 'pendente') {
    return 'PENDING';
  }

  return null;
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
        const mappedStatus = mapProviderStatusToInvoiceStatus(
          statusResponse.status,
        );

        if (mappedStatus && mappedStatus !== invoice.status) {
          invoice.status = mappedStatus;
          invoice.statusDetails = statusResponse.descricao_status;
          if (
            statusResponse.status === 'autorizado' ||
            statusResponse.status === 'processando_digitacao'
          ) {
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
      id: invoice.id.toString(),
      tenantId: invoice.tenantId.toString(),
      orderId: invoice.orderId.toString(),
      type: invoice.type,
      number: invoice.number,
      series: invoice.series,
      accessKey: invoice.accessKey,
      focusIdRef: invoice.focusIdRef,
      status: invoice.status,
      statusDetails: invoice.statusDetails,
      xmlUrl: invoice.xmlUrl,
      pdfUrl: invoice.pdfUrl,
      issuedAt: invoice.issuedAt,
      cancelledAt: invoice.cancelledAt,
      cancelReason: invoice.cancelReason,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt || invoice.createdAt,
    };
  }
}
