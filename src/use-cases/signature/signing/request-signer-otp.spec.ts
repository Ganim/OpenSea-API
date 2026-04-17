import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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

import { SignatureEmailService } from '@/services/signature/signature-email-service';
import { RequestSignerOTPUseCase } from './request-signer-otp';

const TENANT_ID = 'tenant-1';
const ENVELOPE_ID = 'envelope-1';

let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let emailService: SignatureEmailService;
let sut: RequestSignerOTPUseCase;

describe('RequestSignerOTPUseCase', () => {
  beforeEach(() => {
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    emailService = new SignatureEmailService();
    sut = new RequestSignerOTPUseCase(signersRepo, auditRepo, emailService);
  });

  it('should generate and persist OTP hash with expiration in 10 minutes', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'ADVANCED',
      accessToken: 'valid-token',
      externalEmail: 'signer@example.com',
      externalName: 'John Signer',
    });

    const before = Date.now();
    const response = await sut.execute({ accessToken: 'valid-token' });
    const after = Date.now();

    expect(response.otpExpiresAt.getTime()).toBeGreaterThanOrEqual(
      before + 10 * 60 * 1000 - 1000,
    );
    expect(response.otpExpiresAt.getTime()).toBeLessThanOrEqual(
      after + 10 * 60 * 1000 + 1000,
    );

    const storedSigner = signersRepo.items[0];
    expect(storedSigner.otpCodeHash).not.toBeNull();
    expect(storedSigner.otpSentAt).not.toBeNull();
    expect(storedSigner.otpAttempts).toBe(0);
    expect(storedSigner.otpVerified).toBe(false);
  });

  it('should emit OTP_SENT audit event', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'ADVANCED',
      accessToken: 'valid-token',
      externalEmail: 'signer@example.com',
    });

    await sut.execute({
      accessToken: 'valid-token',
      ipAddress: '127.0.0.1',
      userAgent: 'TestAgent',
    });

    expect(auditRepo.items).toHaveLength(1);
    expect(auditRepo.items[0].type).toBe('OTP_SENT');
  });

  it('should throw ResourceNotFoundError for invalid token', async () => {
    await expect(sut.execute({ accessToken: 'invalid' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('should throw BadRequestError for SIMPLE signature level', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'SIMPLE',
      accessToken: 'simple-token',
      externalEmail: 'signer@example.com',
    });

    await expect(sut.execute({ accessToken: 'simple-token' })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should throw BadRequestError if signer already signed', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'ADVANCED',
      accessToken: 'signed-token',
      externalEmail: 'signer@example.com',
      status: 'SIGNED',
    });

    await expect(sut.execute({ accessToken: 'signed-token' })).rejects.toThrow(
      BadRequestError,
    );
  });

  it('should throw BadRequestError if signer has no email', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'ADVANCED',
      accessToken: 'no-email-token',
    });

    await expect(
      sut.execute({ accessToken: 'no-email-token' }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should reset otpAttempts when reissuing OTP', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'ADVANCED',
      accessToken: 'reissue-token',
      externalEmail: 'signer@example.com',
    });

    signersRepo.items[0].props.otpAttempts = 2;

    await sut.execute({ accessToken: 'reissue-token' });

    expect(signersRepo.items[0].otpAttempts).toBe(0);
  });
});
