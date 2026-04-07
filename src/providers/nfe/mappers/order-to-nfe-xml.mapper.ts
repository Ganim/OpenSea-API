import type { Customer } from '@/entities/sales/customer';
import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { CreateInvoiceInput, DetailItem } from '../focus-nfe.types';
import type { CompanyData } from './order-to-nfce-xml.mapper';

/**
 * Mapeia Order + OrderItems para CreateInvoiceInput (NF-e)
 * NF-e é o formato completo para vendas entre empresas
 */
export class OrderToNfeXmlMapper {
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
      type: 'nfe',
      apiKey: '', // Será preenchido pelo use case
      reference: order.id.toString(),
      nature: 'saida',
      series: Number(series),
      natureza_operacao: 'VENDA',
      descricao_operacao: 'Venda de Mercadorias',
      data_emissao: new Date().toISOString().split('T')[0],
      data_saida_entrada: order.confirmedAt?.toISOString().split('T')[0],
      detalhes,
      valor_frete: order.shippingTotal > 0 ? order.shippingTotal : undefined,
      valor_seguro: 0,
      valor_desconto: order.discountTotal > 0 ? order.discountTotal : undefined,
      observacoes: order.notes || undefined,
      ambiente: 2, // sandbox by default

      // Dados do cliente
      ...customerData,
    };
  }

  /**
   * Mapeia OrderItems para lista de DetailItem (com mais campos que NFC-e)
   */
  private static mapItems(items: OrderItem[]): DetailItem[] {
    return items.map((item) => ({
      descricao: item.name,
      quantidade: item.quantity,
      valor_unitario: item.unitPrice,
      codigo_ncm: item.ncm ?? '00000000',
      codigo_cfop: item.cfop ?? '5102',
      origem: 0,
      icms_aliquota: item.taxIcms > 0 ? item.taxIcms : 18,
      icms_valor: (item.quantity * item.unitPrice * item.taxIcms) / 100,
      pis_aliquota: item.taxPis,
      pis_valor: (item.quantity * item.unitPrice * item.taxPis) / 100,
      cofins_aliquota: item.taxCofins,
      cofins_valor: (item.quantity * item.unitPrice * item.taxCofins) / 100,
      ipi_aliquota: item.taxIpi,
      ipi_valor: (item.quantity * item.unitPrice * item.taxIpi) / 100,
    }));
  }

  /**
   * Mapeia Customer para dados de destinatário (NF-e exige CPF/CNPJ)
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
      endereco_destinatario: customer.address || undefined,
      cidade_destinatario: customer.city || undefined,
      uf_destinatario: customer.state || undefined,
      cep_destinatario: customer.zipCode || undefined,
      pais_destinatario: 'BR',
    };
  }
}
