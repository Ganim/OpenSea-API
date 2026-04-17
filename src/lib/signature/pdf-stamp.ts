import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

export interface SignerStampData {
  name: string;
  cpfMasked: string;
  signedAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  signatureLevel: string;
}

export interface CertificateStampParams {
  envelopeTitle: string;
  verificationCode: string;
  documentHash: string;
  signers: SignerStampData[];
  verifyUrl: string;
}

const PAGE_WIDTH = 595.28; // A4 portrait
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const COLOR_DARK = rgb(0.12, 0.16, 0.24);
const COLOR_MUTED = rgb(0.4, 0.44, 0.52);
const COLOR_ACCENT = rgb(0.486, 0.227, 0.929); // violet-600
const COLOR_BORDER = rgb(0.85, 0.87, 0.92);

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}…`
    : value;
}

function formatSignedAtUTC(date: Date): string {
  const pad = (value: number): string => String(value).padStart(2, '0');
  const day = pad(date.getUTCDate());
  const month = pad(date.getUTCMonth() + 1);
  const year = date.getUTCFullYear();
  const hours = pad(date.getUTCHours());
  const minutes = pad(date.getUTCMinutes());
  return `${day}/${month}/${year} ${hours}:${minutes} UTC`;
}

/**
 * Masks a CPF so that only the middle 6 digits are visible.
 * Input: 12345678901 or 123.456.789-01
 * Output: ***.456.789-**
 */
export function maskCPF(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) {
    return '***.***.***-**';
  }
  return `***.${digits.slice(3, 6)}.${digits.slice(6, 9)}-**`;
}

/**
 * Appends a legal certificate page to the original PDF, containing the
 * full signature audit trail, per Lei 14.063/2020.
 *
 * If the original buffer cannot be parsed as PDF, a new certificate-only
 * PDF is created so the caller still obtains proof of the audit trail.
 */
export async function appendSignatureCertificate(
  originalPdfBuffer: Buffer,
  params: CertificateStampParams,
): Promise<Buffer> {
  let pdfDoc: PDFDocument;
  try {
    pdfDoc = await PDFDocument.load(originalPdfBuffer, {
      ignoreEncryption: true,
    });
  } catch {
    pdfDoc = await PDFDocument.create();
  }

  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helveticaOblique = await pdfDoc.embedFont(
    StandardFonts.HelveticaOblique,
  );
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const qrPngDataUrl = await QRCode.toDataURL(params.verifyUrl, {
    margin: 1,
    width: 256,
  });
  const qrImageBytes = Buffer.from(qrPngDataUrl.split(',')[1], 'base64');
  const qrImage = await pdfDoc.embedPng(qrImageBytes);

  const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);

  let cursorY = PAGE_HEIGHT - 60;

  // Header
  page.drawText('Certificado de Autenticidade', {
    x: MARGIN_X,
    y: cursorY,
    size: 18,
    font: helveticaBold,
    color: COLOR_DARK,
  });
  cursorY -= 22;

  page.drawText('Lei 14.063/2020 — Assinatura Eletrônica Avançada', {
    x: MARGIN_X,
    y: cursorY,
    size: 10,
    font: helveticaOblique,
    color: COLOR_MUTED,
  });
  cursorY -= 18;

  // Divider
  page.drawLine({
    start: { x: MARGIN_X, y: cursorY },
    end: { x: PAGE_WIDTH - MARGIN_X, y: cursorY },
    thickness: 1,
    color: COLOR_ACCENT,
  });
  cursorY -= 28;

  // Envelope title
  page.drawText('Documento:', {
    x: MARGIN_X,
    y: cursorY,
    size: 9,
    font: helveticaBold,
    color: COLOR_MUTED,
  });
  cursorY -= 14;
  page.drawText(truncate(params.envelopeTitle, 70), {
    x: MARGIN_X,
    y: cursorY,
    size: 13,
    font: helveticaBold,
    color: COLOR_DARK,
  });
  cursorY -= 28;

  // Verification code (prominent)
  page.drawText('Código de verificação:', {
    x: MARGIN_X,
    y: cursorY,
    size: 9,
    font: helveticaBold,
    color: COLOR_MUTED,
  });
  cursorY -= 14;
  page.drawText(params.verificationCode, {
    x: MARGIN_X,
    y: cursorY,
    size: 20,
    font: courier,
    color: COLOR_ACCENT,
  });
  cursorY -= 28;

  // Document hash (SHA-256)
  page.drawText('Hash SHA-256 do documento:', {
    x: MARGIN_X,
    y: cursorY,
    size: 9,
    font: helveticaBold,
    color: COLOR_MUTED,
  });
  cursorY -= 14;
  page.drawText(params.documentHash, {
    x: MARGIN_X,
    y: cursorY,
    size: 8,
    font: courier,
    color: COLOR_DARK,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
  });
  cursorY -= 28;

  // Signers list
  page.drawText('Signatários:', {
    x: MARGIN_X,
    y: cursorY,
    size: 11,
    font: helveticaBold,
    color: COLOR_DARK,
  });
  cursorY -= 16;

  const signerBlockHeight = 68;
  for (const signer of params.signers) {
    if (cursorY - signerBlockHeight < 180) {
      // Not enough room for signer + QR/footer. Stop appending.
      break;
    }

    // Block border
    page.drawRectangle({
      x: MARGIN_X,
      y: cursorY - signerBlockHeight + 4,
      width: PAGE_WIDTH - MARGIN_X * 2,
      height: signerBlockHeight,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });

    const innerX = MARGIN_X + 10;
    let innerY = cursorY - 4;

    page.drawText(truncate(signer.name, 60), {
      x: innerX,
      y: innerY,
      size: 11,
      font: helveticaBold,
      color: COLOR_DARK,
    });
    innerY -= 12;

    page.drawText(`CPF: ${signer.cpfMasked}`, {
      x: innerX,
      y: innerY,
      size: 9,
      font: helvetica,
      color: COLOR_MUTED,
    });
    innerY -= 11;

    page.drawText(
      `Assinado em ${formatSignedAtUTC(signer.signedAt)} — nível: ${signer.signatureLevel}`,
      {
        x: innerX,
        y: innerY,
        size: 9,
        font: helvetica,
        color: COLOR_DARK,
      },
    );
    innerY -= 11;

    if (signer.ipAddress) {
      page.drawText(`IP: ${signer.ipAddress}`, {
        x: innerX,
        y: innerY,
        size: 8,
        font: helvetica,
        color: COLOR_MUTED,
      });
      innerY -= 10;
    }

    if (signer.userAgent) {
      page.drawText(`UA: ${truncate(signer.userAgent, 60)}`, {
        x: innerX,
        y: innerY,
        size: 8,
        font: helvetica,
        color: COLOR_MUTED,
      });
    }

    cursorY -= signerBlockHeight + 6;
  }

  // QR code + verification link (bottom-right block)
  const qrSize = 120;
  const qrX = PAGE_WIDTH - MARGIN_X - qrSize;
  const qrY = 90;

  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize,
  });

  page.drawText('Escaneie para verificar', {
    x: qrX,
    y: qrY - 12,
    size: 8,
    font: helveticaBold,
    color: COLOR_DARK,
  });

  // Footer
  page.drawLine({
    start: { x: MARGIN_X, y: 60 },
    end: { x: PAGE_WIDTH - MARGIN_X, y: 60 },
    thickness: 0.5,
    color: COLOR_BORDER,
  });
  page.drawText(
    'Este documento foi assinado eletronicamente.',
    {
      x: MARGIN_X,
      y: 44,
      size: 9,
      font: helveticaBold,
      color: COLOR_DARK,
    },
  );
  page.drawText(`Verifique em: ${truncate(params.verifyUrl, 80)}`, {
    x: MARGIN_X,
    y: 30,
    size: 8,
    font: helvetica,
    color: COLOR_MUTED,
  });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
