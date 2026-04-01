import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { BankAccountsRepository } from '@/repositories/finance/bank-accounts-repository';
import type { FinanceEntriesRepository } from '@/repositories/finance/finance-entries-repository';
import type { PaymentOrdersRepository } from '@/repositories/finance/payment-orders-repository';
import {
  collectPDFBuffer,
  createPDFDocument,
  drawHorizontalLine,
  formatBRL,
  formatDateBR,
} from '@/lib/pdf';
import type { FileUploadService } from '@/services/storage/file-upload-service';

export interface GeneratePaymentReceiptRequest {
  tenantId: string;
  orderId: string;
}

export interface GeneratePaymentReceiptResponse {
  receiptFileId: string;
  receiptUrl: string;
}

const METHOD_LABELS: Record<string, string> = {
  PIX: 'PIX',
  TED: 'TED',
  BOLETO: 'Boleto Bancário',
};

export class GeneratePaymentReceiptUseCase {
  constructor(
    private paymentOrdersRepository: PaymentOrdersRepository,
    private financeEntriesRepository: FinanceEntriesRepository,
    private bankAccountsRepository: BankAccountsRepository,
    private fileUploadService: FileUploadService,
  ) {}

  async execute(
    request: GeneratePaymentReceiptRequest,
  ): Promise<GeneratePaymentReceiptResponse> {
    const { tenantId, orderId } = request;

    // 1. Find PaymentOrder — must be COMPLETED
    const order = await this.paymentOrdersRepository.findById(
      new UniqueEntityID(orderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Ordem de pagamento não encontrada');
    }

    if (order.status !== 'COMPLETED') {
      throw new BadRequestError(
        'Apenas ordens de pagamento concluídas podem gerar comprovante',
      );
    }

    // 2. Find related FinanceEntry
    const entry = await this.financeEntriesRepository.findById(
      new UniqueEntityID(order.entryId),
      tenantId,
    );

    // 3. Find BankAccount for bank details
    const bankAccount = await this.bankAccountsRepository.findById(
      new UniqueEntityID(order.bankAccountId),
      tenantId,
    );

    // 4. Generate PDF buffer
    const buffer = await this.buildPDF(order, entry ?? null, bankAccount);

    // 5. Upload to S3
    const filename = `comprovante_pagamento_${orderId}_${Date.now()}.pdf`;
    const uploadResult = await this.fileUploadService.upload(
      buffer,
      filename,
      'application/pdf',
      {
        prefix: `tenants/${tenantId}/payment-receipts`,
        maxSize: 5 * 1024 * 1024, // 5MB
        allowedTypes: ['application/pdf'],
      },
    );

    // 6. Get presigned URL
    const receiptUrl = await this.fileUploadService.getPresignedUrl(
      uploadResult.key,
    );

    return {
      receiptFileId: uploadResult.key,
      receiptUrl,
    };
  }

  private async buildPDF(
    order: {
      id: string;
      method: string;
      amount: number;
      recipientData: Record<string, unknown>;
      externalId: string | null;
      requestedById: string;
      approvedById: string | null;
      approvedAt: Date | null;
      createdAt: Date;
    },
    entry: {
      description: string;
      code: string;
    } | null,
    bankAccount: {
      name: string;
      agency: string;
      accountNumber: string;
      bankName?: string;
      agencyDigit?: string;
      accountDigit?: string;
      displayAgency?: string;
      displayAccount?: string;
    } | null,
  ): Promise<Buffer> {
    const doc = createPDFDocument({
      title: 'Comprovante de Pagamento',
      subject: 'Comprovante de Pagamento - OpenSea ERP',
    });

    const margins = doc.page.margins;
    const contentWidth = doc.page.width - margins.left - margins.right;
    let y = margins.top;

    // ─── Header ───────────────────────────────────────────────────────────
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#1e293b')
      .text('COMPROVANTE DE PAGAMENTO', margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 18;

    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor('#64748b')
      .text('OpenSea ERP', margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 12;

    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1.5 });
    y += 14;

    // ─── Informações Gerais ───────────────────────────────────────────────
    const labelX = margins.left;
    const valueX = margins.left + 100;
    const lineH = 16;

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    doc.font('Helvetica-Bold').text('Data:', labelX, y);
    doc
      .font('Helvetica')
      .text(formatDateBR(order.createdAt), valueX, y, { width: contentWidth });
    y += lineH;

    doc.font('Helvetica-Bold').text('Código:', labelX, y);
    doc
      .font('Helvetica')
      .text(`PO-${order.id.substring(0, 8).toUpperCase()}`, valueX, y, {
        width: contentWidth,
      });
    y += lineH;

    doc.font('Helvetica-Bold').text('Método:', labelX, y);
    doc
      .font('Helvetica')
      .text(METHOD_LABELS[order.method] ?? order.method, valueX, y, {
        width: contentWidth,
      });
    y += lineH;

    doc.font('Helvetica-Bold').text('Status:', labelX, y);
    doc.font('Helvetica').text('Concluído', valueX, y, {
      width: contentWidth,
    });
    y += lineH + 6;

    // ─── Pagador ──────────────────────────────────────────────────────────
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('PAGADOR', labelX, y);
    y += 14;

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    if (bankAccount) {
      doc.font('Helvetica-Bold').text('Banco:', labelX, y);
      doc
        .font('Helvetica')
        .text(bankAccount.bankName ?? bankAccount.name, valueX, y, {
          width: contentWidth,
        });
      y += lineH;

      const agencyDisplay =
        typeof bankAccount.displayAgency === 'string'
          ? bankAccount.displayAgency
          : bankAccount.agency;
      doc.font('Helvetica-Bold').text('Agência:', labelX, y);
      doc.font('Helvetica').text(agencyDisplay, valueX, y, {
        width: contentWidth,
      });
      y += lineH;

      const accountDisplay =
        typeof bankAccount.displayAccount === 'string'
          ? bankAccount.displayAccount
          : bankAccount.accountNumber;
      doc.font('Helvetica-Bold').text('Conta:', labelX, y);
      doc.font('Helvetica').text(maskAccount(accountDisplay), valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    } else {
      doc.font('Helvetica').text('Informações bancárias não disponíveis', labelX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    y += 6;

    // ─── Beneficiário ─────────────────────────────────────────────────────
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('BENEFICIÁRIO', labelX, y);
    y += 14;

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    const recipientName = (order.recipientData.recipientName as string) ?? '';
    const recipientCpfCnpj = (order.recipientData.recipientCpfCnpj as string) ?? '';
    const pixKey = (order.recipientData.pixKey as string) ?? '';

    if (recipientName) {
      doc.font('Helvetica-Bold').text('Nome:', labelX, y);
      doc.font('Helvetica').text(recipientName, valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    if (recipientCpfCnpj) {
      doc.font('Helvetica-Bold').text('CPF/CNPJ:', labelX, y);
      doc.font('Helvetica').text(recipientCpfCnpj, valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    if (order.method === 'PIX' && pixKey) {
      doc.font('Helvetica-Bold').text('Chave PIX:', labelX, y);
      doc.font('Helvetica').text(pixKey, valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    y += 6;

    // ─── Valores ──────────────────────────────────────────────────────────
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('VALORES', labelX, y);
    y += 14;

    doc.font('Helvetica-Bold').fontSize(11).fillColor('#1e293b').text('Valor:', labelX, y);
    doc
      .font('Helvetica-Bold')
      .fontSize(11)
      .fillColor('#0f172a')
      .text(formatBRL(order.amount), valueX, y, { width: contentWidth });
    y += lineH + 6;

    // ─── Identificação ────────────────────────────────────────────────────
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('IDENTIFICAÇÃO', labelX, y);
    y += 14;

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    if (order.externalId) {
      doc.font('Helvetica-Bold').text('ID Externo:', labelX, y);
      doc.font('Helvetica').text(order.externalId, valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    if (entry) {
      doc.font('Helvetica-Bold').text('Lançamento:', labelX, y);
      doc.font('Helvetica').text(entry.description, valueX, y, {
        width: contentWidth,
      });
      y += lineH;

      doc.font('Helvetica-Bold').text('Código:', labelX, y);
      doc.font('Helvetica').text(entry.code, valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    y += 6;

    // ─── Aprovação ────────────────────────────────────────────────────────
    drawHorizontalLine(doc, y, { color: '#cbd5e1', lineWidth: 0.5 });
    y += 8;

    doc.font('Helvetica-Bold').fontSize(9).fillColor('#475569').text('APROVAÇÃO', labelX, y);
    y += 14;

    doc.font('Helvetica').fontSize(9).fillColor('#1e293b');

    doc.font('Helvetica-Bold').text('Solicitado por:', labelX, y);
    doc.font('Helvetica').text(order.requestedById, valueX, y, {
      width: contentWidth,
    });
    y += lineH;

    if (order.approvedById) {
      doc.font('Helvetica-Bold').text('Aprovado por:', labelX, y);
      doc.font('Helvetica').text(order.approvedById, valueX, y, {
        width: contentWidth,
      });
      y += lineH;
    }

    if (order.approvedAt) {
      doc.font('Helvetica-Bold').text('Aprovado em:', labelX, y);
      doc
        .font('Helvetica')
        .text(formatDateTimeBR(order.approvedAt), valueX, y, {
          width: contentWidth,
        });
      y += lineH;
    }

    y += 10;

    // ─── Footer ───────────────────────────────────────────────────────────
    drawHorizontalLine(doc, y, { color: '#1e293b', lineWidth: 1.5 });
    y += 10;

    const timestamp = formatDateTimeBR(new Date());

    doc
      .font('Helvetica')
      .fontSize(7)
      .fillColor('#94a3b8')
      .text('Documento gerado automaticamente', margins.left, y, {
        width: contentWidth,
        align: 'center',
      });
    y += 11;

    doc.text(`OpenSea ERP — ${timestamp}`, margins.left, y, {
      width: contentWidth,
      align: 'center',
    });

    return collectPDFBuffer(doc);
  }
}

function maskAccount(account: string): string {
  if (account.length <= 4) return account;
  const visible = account.slice(-4);
  return `****${visible}`;
}

function formatDateTimeBR(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
