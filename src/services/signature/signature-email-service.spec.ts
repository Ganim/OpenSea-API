import { describe, expect, it, vi } from 'vitest';

// Mock env before importing the service (keeps test isolated from real config)
vi.mock('@/@env', () => ({
  env: {
    NODE_ENV: 'test',
    SMTP_HOST: 'localhost',
    SMTP_PORT: 587,
    SMTP_USER: 'user',
    SMTP_PASS: 'pass',
    FRONTEND_URL: 'http://localhost:3000',
  },
}));

import { SignatureEmailService } from './signature-email-service';

describe('SignatureEmailService', () => {
  const service = new SignatureEmailService();

  it('should simulate signature request email in test environment', async () => {
    const result = await service.sendSignatureRequest({
      to: 'external@example.com',
      signerName: 'Fulano da Silva',
      envelopeTitle: 'Contrato de Prestação de Serviços',
      accessToken: 'access-token-abc',
      verificationCode: 'ABCDEF2345',
      expiresAt: new Date('2027-01-15T00:00:00Z'),
    });

    expect(result.success).toBe(true);
    expect(result.return).toBeDefined();
  });

  it('should simulate OTP email with code in test environment', async () => {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const result = await service.sendOTP({
      to: 'signer@example.com',
      signerName: 'Beltrano Souza',
      otpCode: '492817',
      expiresAt,
    });

    expect(result.success).toBe(true);
    const envelope = (result.return as { envelope: { to: string[] } }).envelope;
    expect(envelope.to).toContain('signer@example.com');
  });

  it('should simulate reminder email with remaining days', async () => {
    const result = await service.sendReminder({
      to: 'pending@example.com',
      signerName: 'Ciclano Pereira',
      envelopeTitle: 'Acordo NDA',
      accessToken: 'token-xyz',
      daysRemaining: 3,
    });

    expect(result.success).toBe(true);
  });

  it('should simulate completion confirmation email with verify URL', async () => {
    const result = await service.sendCompletionConfirmation({
      to: 'customer@example.com',
      signerName: 'Maria Oliveira',
      envelopeTitle: 'Proposta Comercial #789',
      verifyUrl: 'https://app.opensea.com/sign/verify/abc123',
    });

    expect(result.success).toBe(true);
  });

  it('should handle null expiresAt in signature request', async () => {
    const result = await service.sendSignatureRequest({
      to: 'openended@example.com',
      signerName: 'João Santos',
      envelopeTitle: 'Contrato sem prazo',
      accessToken: 'token-open',
      verificationCode: 'XYZ2345678',
      expiresAt: null,
    });

    expect(result.success).toBe(true);
  });

  it('should handle null daysRemaining in reminder', async () => {
    const result = await service.sendReminder({
      to: 'nodeadline@example.com',
      signerName: 'Pedro Alves',
      envelopeTitle: 'Termo sem prazo',
      accessToken: 'token-nodeadline',
      daysRemaining: null,
    });

    expect(result.success).toBe(true);
  });
});
