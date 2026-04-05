import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Invoice } from '@/entities/sales/invoice';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { OrderItemsRepository } from '@/repositories/sales/order-items-repository';
import type { CustomersRepository } from '@/repositories/sales/customers-repository';
import type { InvoicesRepository } from '@/repositories/sales/invoices-repository';
import type { FocusNfeConfigRepository } from '@/repositories/sales/focus-nfe-config-repository';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import { OrderToNfceXmlMapper } from '@/providers/nfe/mappers/order-to-nfce-xml.mapper';
import { orderPrismaToDomain } from '@/mappers/sales/order/order-prisma-to-domain';

interface IssueInvoiceUseCaseRequest {
  orderId: string;
  tenantId: string;
  userId: string;
  invoiceType?: 'NFE' | 'NFCE';
}

interface IssueInvoiceUseCaseResponse {
  invoiceId: string;
  accessKey: string;
  status: string;
  issuedAt: Date;
  xmlUrl?: string;
  pdfUrl?: string;
}

export class IssueInvoiceUseCase {
  constructor(
    private ordersRepository: OrdersRepository,
    private orderItemsRepository: OrderItemsRepository,
    private customersRepository: CustomersRepository,
    private invoicesRepository: InvoicesRepository,
    private focusNfeConfigRepository: FocusNfeConfigRepository,
    private focusNfeProvider: IFocusNfeProvider,
  ) {}

  async execute(
    request: IssueInvoiceUseCaseRequest,
  ): Promise<IssueInvoiceUseCaseResponse> {
    // Busca Order
    const order = await this.ordersRepository.findById(
      new UniqueEntityID(request.orderId),
      request.tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Order not found.');
    }

    // Valida status da order
    if (order.status !== 'CONFIRMED') {
      throw new BadRequestError(
        `Order must be CONFIRMED to issue invoice. Current status: ${order.status}`,
      );
    }

    // Valida que não existe invoice para order
    const existingInvoice = await this.invoicesRepository.findByOrderId(
      order.id,
      request.tenantId,
    );

    if (existingInvoice) {
      throw new BadRequestError(
        `Invoice already exists for this order (${existingInvoice.accessKey}).`,
      );
    }

    // Busca e valida configuração Focus NFe
    const config = await this.focusNfeConfigRepository.findByTenant(request.tenantId);

    if (!config) {
      throw new BadRequestError(
        'Focus NFe not configured for this tenant. Please configure first.',
      );
    }

    if (!config.isEnabled) {
      throw new BadRequestError('Focus NFe is disabled for this tenant.');
    }

    // Busca items da order
    const orderItems = await this.orderItemsRepository.findByOrderId(
      order.id,
      request.tenantId,
    );

    if (!orderItems || orderItems.length === 0) {
      throw new BadRequestError('Order must have at least one item to issue invoice.');
    }

    // Busca customer
    const customer = await this.customersRepository.findById(
      order.customerId,
      request.tenantId,
    );

    // TODO: Implementar busca de dados da empresa via Tenant/Company
    const companyData = {
      cnpj: '12345678000190', // Placeholder
      razaoSocial: 'Demo Company',
      endereco: 'Rua Demo',
      numero: '123',
      bairro: 'Centro',
      cidade: 'São Paulo',
      uf: 'SP',
      cep: '01000000',
    };

    // Mapeia order para invoice input (NFC-e)
    const invoiceType = request.invoiceType ?? 'NFCE';
    const invoiceInput =
      invoiceType === 'NFCE'
        ? OrderToNfceXmlMapper.map(order, orderItems, customer, companyData, config.defaultSeries)
        : OrderToNfceXmlMapper.map(order, orderItems, customer, companyData, config.defaultSeries);

    // Adiciona API key do Focus NFe
    invoiceInput.apiKey = config.apiKey;
    invoiceInput.ambiente = config.productionMode ? 1 : 2;

    // Cria Invoice entity com status PENDING
    const invoice = Invoice.create({
      tenantId: order.tenantId,
      orderId: order.id,
      type: invoiceType as 'NFE' | 'NFCE',
      number: '', // Será preenchido após chamada ao Focus
      series: config.defaultSeries,
      accessKey: '', // Será preenchido após chamada ao Focus
      status: 'PENDING',
    });

    // Tenta emitir invoice via Focus NFe
    let focusResponse;
    try {
      focusResponse = await this.focusNfeProvider.createInvoice(invoiceInput);
    } catch (error) {
      // Se der erro, marca como ERROR
      invoice.markAsError(error instanceof Error ? error.message : String(error));
      await this.invoicesRepository.create(invoice);

      throw new Error(
        `Failed to issue invoice via Focus NFe: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Valida resposta do Focus
    if (!focusResponse.chave_nfe || !focusResponse.status_code) {
      invoice.markAsError('Invalid response from Focus NFe provider');
      await this.invoicesRepository.create(invoice);
      throw new BadRequestError('Invalid response from Focus NFe provider');
    }

    // Atualiza invoice com dados da resposta
    invoice.props.number = String(focusResponse.numero_nf || '');
    invoice.props.accessKey = focusResponse.chave_nfe || '';
    invoice.props.focusIdRef = focusResponse.id;
    invoice.props.xmlUrl = focusResponse.caminho_xml;
    invoice.props.pdfUrl = focusResponse.caminho_pdf;

    // Se status for sucesso no Focus, marca como ISSUED
    if (focusResponse.status === 'processando_digitacao' || focusResponse.status === 'autorizado') {
      invoice.markAsIssued(
        focusResponse.chave_nfe,
        focusResponse.id,
        focusResponse.caminho_xml,
        focusResponse.caminho_pdf,
      );
    } else {
      invoice.markAsError(`Focus status: ${focusResponse.descricao_status}`);
    }

    // Persiste Invoice
    await this.invoicesRepository.create(invoice);

    // TODO: Emitir InvoiceIssuedEvent para audit, email, etc

    // Se configurado, atualiza Order status para INVOICED
    if (config.autoIssueOnConfirm && invoice.status === 'ISSUED') {
      // TODO: atualizar order.invoiceId e status se necessário
    }

    return {
      invoiceId: invoice.id.toString(),
      accessKey: invoice.accessKey,
      status: invoice.status,
      issuedAt: invoice.issuedAt || new Date(),
      xmlUrl: invoice.xmlUrl,
      pdfUrl: invoice.pdfUrl,
    };
  }
}
