import { describe, expect, it } from 'vitest';

import { renderReceiptPdf, type ReceiptPdfData } from './receipt-pdf-renderer';

const baseData: ReceiptPdfData = {
  tenantRazaoSocial: 'Empresa Demo LTDA',
  tenantCnpj: '12345678000190',
  employeeName: 'JOÃO DA SILVA',
  employeeRegistrationNumber: '12345',
  employeeDepartmentName: 'TI',
  nsrNumber: 1234,
  timestamp: new Date('2026-03-15T08:02:00Z'),
  entryTypeLabel: 'Entrada',
  status: 'APPROVED',
  nsrHash: 'a'.repeat(64),
  verifyUrl: `https://app.opensea.com.br/punch/verify/${'a'.repeat(64)}`,
};

describe('renderReceiptPdf', () => {
  it('retorna Buffer começando com magic bytes %PDF-', async () => {
    const buffer = await renderReceiptPdf(baseData);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
  });

  it('produz um arquivo razoável (> 1KB)', async () => {
    const buffer = await renderReceiptPdf(baseData);
    expect(buffer.length).toBeGreaterThan(1024);
  });

  it('não lança em input válido sem departmentName', async () => {
    const data = { ...baseData, employeeDepartmentName: undefined };
    await expect(renderReceiptPdf(data)).resolves.toBeInstanceOf(Buffer);
  });

  it('não lança para status PENDING_APPROVAL', async () => {
    const data: ReceiptPdfData = { ...baseData, status: 'PENDING_APPROVAL' };
    const buffer = await renderReceiptPdf(data);
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(1024);
  });

  it('renderiza com logo buffer (opcional)', async () => {
    // Pequeno PNG 1×1 transparente válido
    const pngSignature = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
      0x0d, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
      0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
    const data: ReceiptPdfData = {
      ...baseData,
      tenantLogoBuffer: pngSignature,
    };
    await expect(renderReceiptPdf(data)).resolves.toBeInstanceOf(Buffer);
  });

  it('inclui texto do NSR no conteúdo do PDF (sanity)', async () => {
    const buffer = await renderReceiptPdf(baseData);
    // PDF stream em si é comprimido; procuramos a presença no metadata Title.
    const haystack = buffer.toString('latin1');
    expect(haystack).toContain('000001234'); // NSR padStart(9, '0')
  });
});
