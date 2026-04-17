import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { appendSignatureCertificate, maskCPF } from './pdf-stamp';

async function createMinimalPdf(): Promise<Buffer> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  const bytes = await doc.save();
  return Buffer.from(bytes);
}

describe('maskCPF', () => {
  it('should mask an unformatted CPF revealing only the middle 6 digits', () => {
    expect(maskCPF('12345678901')).toBe('***.456.789-**');
  });

  it('should mask a formatted CPF revealing only the middle 6 digits', () => {
    expect(maskCPF('123.456.789-01')).toBe('***.456.789-**');
  });

  it('should return a fully-masked CPF for invalid input', () => {
    expect(maskCPF('123')).toBe('***.***.***-**');
  });
});

describe('appendSignatureCertificate', () => {
  it('should append a certificate page to the original PDF', async () => {
    const original = await createMinimalPdf();
    const originalPageCount = (await PDFDocument.load(original)).getPageCount();

    const stamped = await appendSignatureCertificate(original, {
      envelopeTitle: 'Contrato de Prestação de Serviços',
      verificationCode: 'ABCDEF2345',
      documentHash:
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      signers: [
        {
          name: 'João da Silva',
          cpfMasked: '***.456.789-**',
          signedAt: new Date('2026-04-17T12:00:00Z'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0 TestBrowser',
          signatureLevel: 'ADVANCED',
        },
      ],
      verifyUrl: 'https://app.opensea.com/verify/ABCDEF2345',
    });

    expect(stamped).toBeInstanceOf(Buffer);
    expect(stamped.subarray(0, 4).toString()).toBe('%PDF');

    const finalDoc = await PDFDocument.load(stamped);
    expect(finalDoc.getPageCount()).toBe(originalPageCount + 1);
  });

  it('should handle invalid PDF buffers by creating a certificate-only PDF', async () => {
    const invalidBuffer = Buffer.from('not a pdf');

    const stamped = await appendSignatureCertificate(invalidBuffer, {
      envelopeTitle: 'Fallback',
      verificationCode: 'XYZ',
      documentHash: 'deadbeef'.repeat(8),
      signers: [],
      verifyUrl: 'https://app.opensea.com/verify/XYZ',
    });

    expect(stamped.subarray(0, 4).toString()).toBe('%PDF');
    const finalDoc = await PDFDocument.load(stamped);
    expect(finalDoc.getPageCount()).toBe(1);
  });

  it('should render all signers in a multi-signer envelope', async () => {
    const original = await createMinimalPdf();

    const stamped = await appendSignatureCertificate(original, {
      envelopeTitle: 'Multi-signer contract',
      verificationCode: 'MULTI12345',
      documentHash: 'a'.repeat(64),
      signers: [
        {
          name: 'Signatário Um',
          cpfMasked: '***.111.111-**',
          signedAt: new Date('2026-04-17T12:00:00Z'),
          ipAddress: '10.0.0.1',
          userAgent: 'UA1',
          signatureLevel: 'ADVANCED',
        },
        {
          name: 'Signatário Dois',
          cpfMasked: '***.222.222-**',
          signedAt: new Date('2026-04-17T13:00:00Z'),
          ipAddress: null,
          userAgent: null,
          signatureLevel: 'ADVANCED',
        },
      ],
      verifyUrl: 'https://app.opensea.com/verify/MULTI12345',
    });

    const finalDoc = await PDFDocument.load(stamped);
    expect(finalDoc.getPageCount()).toBeGreaterThanOrEqual(2);
  });
});
