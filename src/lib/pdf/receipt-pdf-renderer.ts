/**
 * Receipt PDF renderer (Phase 06 / Plan 06-03).
 *
 * Renderiza um recibo de batida de ponto em formato A6 retrato (105×148mm)
 * com:
 *  - Cabeçalho: razão social + CNPJ (opcional logo)
 *  - Dados do funcionário (matrícula + departamento — PDF é privado, vai
 *    direto para o funcionário)
 *  - Data/hora + NSR + tipo de batida + status
 *  - QR code apontando para a rota pública `/punch/verify/:nsrHash`
 *  - Rodapé com URL de verificação humano-legível
 *
 * Isolado de repositórios/Prisma/env para ser facilmente unit-testável.
 */

import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export interface ReceiptPdfData {
  tenantRazaoSocial: string;
  /** CNPJ sem máscara (14 dígitos). O PDF é privado, exibe completo. */
  tenantCnpj: string;
  /** Logo em buffer (PNG/JPG). Opcional. */
  tenantLogoBuffer?: Buffer;
  employeeName: string;
  employeeRegistrationNumber: string;
  employeeDepartmentName?: string;
  nsrNumber: number;
  timestamp: Date;
  /** Label em português (ex: "Entrada", "Saída", "Início do intervalo"). */
  entryTypeLabel: string;
  status: 'APPROVED' | 'PENDING_APPROVAL';
  /** HMAC-SHA256 hex 64-char (computeReceiptNsrHash). */
  nsrHash: string;
  /** URL absoluta para o QR code (ex: `https://app.opensea.com.br/punch/verify/ABC…`). */
  verifyUrl: string;
}

/**
 * Formata CNPJ (14 dígitos) para máscara `00.000.000/0000-00`.
 * Usada apenas no PDF privado — rota pública usa máscara com asteriscos.
 */
function formatCnpj(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '').padStart(14, '0');
  return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(
    5,
    8,
  )}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`;
}

/**
 * Formata data/hora no padrão brasileiro (dd/MM/yyyy HH:mm:ss).
 */
function formatDateBR(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

/**
 * Renderiza o recibo de batida em PDF A6 retrato.
 *
 * Retorna `Buffer` começando com magic bytes `%PDF-` (valida pdfkit).
 * Tamanho típico: 3KB – 30KB (dominado pelo QR code PNG embed).
 */
export async function renderReceiptPdf(data: ReceiptPdfData): Promise<Buffer> {
  const doc = new PDFDocument({
    size: 'A6',
    margin: 20,
    info: {
      Title: `Recibo NSR ${String(data.nsrNumber).padStart(9, '0')}`,
      Author: 'OpenSea ERP',
      Subject: 'Recibo de batida de ponto — Portaria MTP 671/2021',
    },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk: Buffer) => chunks.push(chunk));

  // ─── Header: logo + razão social + CNPJ ────────────────────────────────────
  if (data.tenantLogoBuffer) {
    try {
      doc.image(data.tenantLogoBuffer, { width: 40 });
      doc.moveDown(0.3);
    } catch {
      // logo inválido — ignora silenciosamente
    }
  }

  doc.font('Helvetica-Bold').fontSize(11).text(data.tenantRazaoSocial);
  doc
    .font('Helvetica')
    .fontSize(9)
    .text(`CNPJ: ${formatCnpj(data.tenantCnpj)}`);

  // ─── Divider ──────────────────────────────────────────────────────────────
  doc.moveDown(0.5);
  const dividerY = doc.y;
  doc
    .strokeColor('#cccccc')
    .lineWidth(0.5)
    .moveTo(doc.page.margins.left, dividerY)
    .lineTo(doc.page.width - doc.page.margins.right, dividerY)
    .stroke();
  doc.strokeColor('black').lineWidth(1);

  // ─── Título ───────────────────────────────────────────────────────────────
  doc.moveDown(0.5);
  doc
    .font('Helvetica-Bold')
    .fontSize(11)
    .text('RECIBO DE BATIDA DE PONTO', { align: 'center' });

  // ─── Dados do funcionário ─────────────────────────────────────────────────
  doc.moveDown(0.8);
  doc.font('Helvetica').fontSize(8);
  doc.text(`Funcionário: ${data.employeeName}`);
  doc.text(`Matrícula: ${data.employeeRegistrationNumber}`);
  if (data.employeeDepartmentName) {
    doc.text(`Departamento: ${data.employeeDepartmentName}`);
  }

  // ─── Dados da batida ──────────────────────────────────────────────────────
  doc.moveDown(0.6);
  doc.text(`Data e hora: ${formatDateBR(data.timestamp)}`);
  doc.text(`NSR: ${String(data.nsrNumber).padStart(9, '0')}`);
  doc.text(`Tipo: ${data.entryTypeLabel}`);
  doc.text(
    `Status: ${data.status === 'APPROVED' ? 'Registrado' : 'Aguardando aprovação'}`,
  );

  // ─── QR code ──────────────────────────────────────────────────────────────
  // Gera QR como buffer PNG em alta resolução (300px) e embed no PDF em 80pt.
  const qrBuffer = await QRCode.toBuffer(data.verifyUrl, {
    errorCorrectionLevel: 'M',
    width: 300,
    margin: 1,
  });

  doc.moveDown(1);
  const qrSize = 80;
  const qrX = (doc.page.width - qrSize) / 2;
  doc.image(qrBuffer, qrX, doc.y, { width: qrSize });
  doc.moveDown(qrSize / 12);

  // ─── Rodapé com URL ───────────────────────────────────────────────────────
  doc.moveDown(0.3);
  doc.fontSize(7).text('Consulte a autenticidade em:', { align: 'center' });
  doc.fontSize(6).text(data.verifyUrl, { align: 'center' });

  doc.end();

  return new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
