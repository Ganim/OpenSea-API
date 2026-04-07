import type { Customer } from '@/entities/sales/customer';
import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { CreateInvoiceInput, DetailItem } from '../focus-nfe.types';

/**
 * Mapeia Order + OrderItems para CreateInvoiceInput (NFC-e)
 * NFC-e é o formato para vendas diretas (PDV)
 */
export class OrderToNfceXmlMapper {
  /**
   * Mapeia uma Order com items para entrada do Focus NFe
   */
  static map(
    order: Order,
    orderItems: OrderItem[],
    customer: Customer | null,
    companyData: CompanyData,
    series: number | string = 1,
  ): CreateInvoiceInput {
    const detalhes = this.mapItems(orderItems);
    const customerData = this.mapCustomer(customer);

    return {
      type: 'nfce',
      apiKey: '', // Será preenchido pelo use case
      reference: order.id.toString(),
      nature: 'saida',
      series: Number(series),
      natureza_operacao: 'VENDA',
      descricao_operacao: 'Venda de Mercadorias',
      data_emissao: new Date().toISOString().split('T')[0],
      detalhes,
      valor_frete: order.shippingTotal > 0 ? order.shippingTotal : undefined,
      valor_desconto: order.discountTotal > 0 ? order.discountTotal : undefined,
      observacoes: order.notes || undefined,
      ambiente: 2, // sandbox by default

      // Dados do cliente
      ...customerData,
    };
  }

  /**
   * Mapeia OrderItems para lista de DetailItem
   */
  private static mapItems(items: OrderItem[]): DetailItem[] {
    return items.map((item) => ({
      descricao: item.name,
      quantidade: item.quantity,
      valor_unitario: item.unitPrice,
      codigo_ncm: '00000000', // TODO: usar NCM do variant se disponível
      codigo_cfop: '5102', // CFOP padrão para venda de mercadorias
      origem: 0, // 0: Nacional
      icms_aliquota: item.taxIcms > 0 ? item.taxIcms : 18,
      icms_valor: (item.quantity * item.unitPrice * item.taxIcms) / 100,
    }));
  }

  /**
   * Mapeia Customer para dados de destinatário
   */
  private static mapCustomer(
    customer: Customer | null,
  ): Partial<CreateInvoiceInput> {
    if (!customer) {
      return {
        nome_destinatario: 'Consumidor Final',
        cpf_cnpj_destinatario: '00000000000191', // CNPJ consumidor final
        pais_destinatario: 'BR',
      };
    }

    return {
      nome_destinatario: customer.name,
      cpf_cnpj_destinatario: customer.document?.value,
      email_destinatario: customer.email || undefined,
      telefone_destinatario: customer.phone || undefined,
    };
  }
}

/**
 * Dados da empresa emitente (obtidos via Tenant ou via API)
 */
export interface CompanyData {
  cnpj: string;
  razaoSocial: string;
  nomeFantasia?: string;
  endereco: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
  cep: string;
  email?: string;
  telefone?: string;
  inscricaoEstadual?: string;
}
