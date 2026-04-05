import type { Order } from '@/entities/sales/order';
import type { OrderItem } from '@/entities/sales/order-item';
import type { Customer } from '@/entities/sales/customer';
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
    return items
      .filter((item) => !item.isDeleted)
      .map((item) => ({
        descricao: item.name,
        quantidade: item.quantity,
        valor_unitario: item.unitPrice,
        codigo_ncm: '00000000', // TODO: usar NCM do variant se disponível
        codigo_cfop: '5102', // CFOP padrão para venda de mercadorias
        origem: 0, // 0: Nacional
        
        // ICMS (18% padrão)
        icms_aliquota: item.taxRate ? item.taxRate * 100 : 18,
        icms_valor: (item.quantity * item.unitPrice * (item.taxRate || 0.18)) / 100,
        
        // PIS (1.65% padrão)
        pis_aliquota: 1.65,
        pis_valor: (item.quantity * item.unitPrice * 0.0165) / 100,
        
        // COFINS (7.6% padrão)
        cofins_aliquota: 7.6,
        cofins_valor: (item.quantity * item.unitPrice * 0.076) / 100,
        
        // IPI (0% padrão)
        ipi_aliquota: 0,
        ipi_valor: 0,
      }));
  }

  /**
   * Mapeia Customer para dados de destinatário (NF-e exige CPF/CNPJ)
   */
  private static mapCustomer(customer: Customer | null): Partial<CreateInvoiceInput> {
    if (!customer) {
      return {
        nome_destinatario: 'Consumidor Final',
        cpf_cnpj_destinatario: '00000000000191', // CNPJ consumidor final
        pais_destinatario: 'BR',
      };
    }

    const address = customer.addresses?.[0];

    return {
      nome_destinatario: customer.name,
      cpf_cnpj_destinatario: customer.cpfCnpj,
      email_destinatario: customer.email || undefined,
      telefone_destinatario: customer.phone || undefined,
      
      // Endereço se disponível
      endereco_destinatario: address?.street || undefined,
      numero_destinatario: address?.number || undefined,
      complemento_destinatario: address?.complement || undefined,
      bairro_destinatario: address?.neighborhood || undefined,
      cidade_destinatario: address?.city || undefined,
      uf_destinatario: address?.state || undefined,
      cep_destinatario: address?.zipCode || undefined,
      pais_destinatario: 'BR',
    };
  }
}
