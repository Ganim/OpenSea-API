import { ESCPOSGenerator } from './escpos-generator';

export interface ReceiptSection {
  type: 'header' | 'items' | 'totals' | 'payment' | 'footer' | 'qrcode';
  data: unknown;
}

export interface CompanyData {
  name: string;
  cnpj: string;
  address?: string;
  phone?: string;
}

export interface OrderItemData {
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface InvoiceData {
  number: string;
  series: string;
  accessKey?: string;
}

interface TotalsData {
  subtotal: number;
  discount: number;
  total: number;
  taxes: number;
}

interface PaymentData {
  method: string;
  amount: number;
}

interface ReceiptBuilderConfig {
  paperWidth: 80 | 58;
  companyName: string;
  cnpj: string;
}

export class ReceiptBuilder {
  private readonly sections: ReceiptSection[] = [];
  private readonly config: ReceiptBuilderConfig;

  constructor(config: ReceiptBuilderConfig) {
    this.config = config;
  }

  addHeader(company: CompanyData): this {
    this.sections.push({ type: 'header', data: company });
    return this;
  }

  addItems(items: OrderItemData[]): this {
    this.sections.push({ type: 'items', data: items });
    return this;
  }

  addTotals(
    subtotal: number,
    discount: number,
    total: number,
    taxes: number,
  ): this {
    this.sections.push({
      type: 'totals',
      data: { subtotal, discount, total, taxes } satisfies TotalsData,
    });
    return this;
  }

  addPaymentMethod(method: string, amount: number): this {
    this.sections.push({
      type: 'payment',
      data: { method, amount } satisfies PaymentData,
    });
    return this;
  }

  addNfeInfo(invoice: InvoiceData): this {
    this.sections.push({ type: 'footer', data: invoice });
    return this;
  }

  addQrCode(orderId: string): this {
    this.sections.push({ type: 'qrcode', data: { orderId } });
    return this;
  }

  addFooter(thanks = 'Obrigado pela preferencia!'): this {
    this.sections.push({ type: 'footer', data: { thanks } });
    return this;
  }

  generate(): ESCPOSGenerator {
    const generator = new ESCPOSGenerator({
      paperWidth: this.config.paperWidth,
    });
    const separator = '-'.repeat(this.config.paperWidth === 58 ? 32 : 42);

    generator.init();

    if (!this.sections.some((section) => section.type === 'header')) {
      this.addHeader({
        name: this.config.companyName,
        cnpj: this.config.cnpj,
      });
    }

    for (const section of this.sections) {
      switch (section.type) {
        case 'header': {
          const header = section.data as CompanyData;
          generator.setFontSize(2, 2).center(header.name).setFontSize(1, 1);
          generator.center(`CNPJ: ${header.cnpj}`);
          if (header.address) generator.center(header.address);
          if (header.phone) generator.center(`Tel: ${header.phone}`);
          generator.left(separator).newLine();
          break;
        }
        case 'items': {
          const items = section.data as OrderItemData[];
          for (const item of items) {
            generator.bold(item.name);
            generator.left(
              `${item.quantity}x ${this.formatCurrency(item.unitPrice)} = ${this.formatCurrency(item.subtotal)}`,
            );
          }
          generator.left(separator).newLine();
          break;
        }
        case 'totals': {
          const totals = section.data as TotalsData;
          generator.left(`Subtotal: ${this.formatCurrency(totals.subtotal)}`);
          generator.left(`Desconto: ${this.formatCurrency(totals.discount)}`);
          generator.left(`Impostos: ${this.formatCurrency(totals.taxes)}`);
          generator.bold_underline(
            `TOTAL: ${this.formatCurrency(totals.total)}`,
          );
          generator.left(separator).newLine();
          break;
        }
        case 'payment': {
          const payment = section.data as PaymentData;
          generator.left(`Pagamento: ${payment.method}`);
          generator.left(`Valor pago: ${this.formatCurrency(payment.amount)}`);
          generator.newLine();
          break;
        }
        case 'qrcode': {
          const qrData = section.data as { orderId: string };
          generator.center('Acompanhe seu pedido');
          generator.qrCode(qrData.orderId, 6).newLine();
          break;
        }
        case 'footer': {
          const footer = section.data as {
            thanks?: string;
            number?: string;
            series?: string;
          };
          if (footer.number && footer.series) {
            generator.left(`NF-e: ${footer.number}/${footer.series}`);
          }
          if (footer.thanks) {
            generator.center(footer.thanks);
          }
          generator.newLine();
          break;
        }
        default:
          break;
      }
    }

    generator.cutPaper(true);
    return generator;
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }
}
