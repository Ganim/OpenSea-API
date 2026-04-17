import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { GoneError } from '@/@errors/use-cases/gone-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TooManyRequestsError } from '@/@errors/use-cases/too-many-requests-error';
import { hashOTP } from '@/lib/signature/otp';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { VerifySignerOTPUseCase } from './verify-signer-otp';

const TENANT_ID = 'tenant-1';
const ENVELOPE_ID = 'envelope-1';
const VALID_OTP = '123456';

let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let sut: VerifySignerOTPUseCase;

async function seedSignerWithOTP(
  overrides: {
    attempts?: number;
    expiresInMs?: number;
    hash?: string | null;
  } = {},
) {
  const otpCodeHash = overrides.hash === null ? null : await hashOTP(VALID_OTP);
  const expiresInMs = overrides.expiresInMs ?? 10 * 60 * 1000;
  await signersRepo.create({
    tenantId: TENANT_ID,
    envelopeId: ENVELOPE_ID,
    signatureLevel: 'ADVANCED',
    accessToken: 'valid-token',
    externalEmail: 'signer@example.com',
  });
  const signer = signersRepo.items[0];
  signer.props.otpCodeHash = otpCodeHash;
  signer.props.otpExpiresAt = new Date(Date.now() + expiresInMs);
  signer.props.otpAttempts = overrides.attempts ?? 0;
}

describe('VerifySignerOTPUseCase', () => {
  beforeEach(() => {
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    sut = new VerifySignerOTPUseCase(signersRepo, auditRepo);
  });

  it('should verify a valid OTP and mark signer as otpVerified', async () => {
    await seedSignerWithOTP();

    const { verified } = await sut.execute({
      accessToken: 'valid-token',
      otpCode: VALID_OTP,
    });

    expect(verified).toBe(true);
    expect(signersRepo.items[0].otpVerified).toBe(true);
    expect(signersRepo.items[0].otpCodeHash).toBeNull();
  });

  it('should emit OTP_VERIFIED audit event with success=true on valid OTP', async () => {
    await seedSignerWithOTP();

    await sut.execute({ accessToken: 'valid-token', otpCode: VALID_OTP });

    expect(auditRepo.items).toHaveLength(1);
    expect(auditRepo.items[0].type).toBe('OTP_VERIFIED');
    expect(auditRepo.items[0].metadata).toMatchObject({ success: true });
  });

  it('should increment attempts and return verified=false on wrong OTP', async () => {
    await seedSignerWithOTP();

    const { verified } = await sut.execute({
      accessToken: 'valid-token',
      otpCode: '999999',
    });

    expect(verified).toBe(false);
    expect(signersRepo.items[0].otpAttempts).toBe(1);
    expect(auditRepo.items[0].metadata).toMatchObject({ success: false });
  });

  it('should throw GoneError on expired OTP', async () => {
    await seedSignerWithOTP({ expiresInMs: -1000 });

    await expect(
      sut.execute({ accessToken: 'valid-token', otpCode: VALID_OTP }),
    ).rejects.toThrow(GoneError);
  });

  it('should throw TooManyRequestsError after 3 attempts', async () => {
    await seedSignerWithOTP({ attempts: 3 });

    await expect(
      sut.execute({ accessToken: 'valid-token', otpCode: '999999' }),
    ).rejects.toThrow(TooManyRequestsError);
  });

  it('should throw BadRequestError when OTP was never requested', async () => {
    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: ENVELOPE_ID,
      signatureLevel: 'ADVANCED',
      accessToken: 'no-otp-token',
      externalEmail: 'signer@example.com',
    });

    await expect(
      sut.execute({ accessToken: 'no-otp-token', otpCode: VALID_OTP }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw ResourceNotFoundError for invalid token', async () => {
    await expect(
      sut.execute({ accessToken: 'invalid', otpCode: VALID_OTP }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw BadRequestError if signer already signed', async () => {
    await seedSignerWithOTP();
    signersRepo.items[0].props.status = 'SIGNED';

    await expect(
      sut.execute({ accessToken: 'valid-token', otpCode: VALID_OTP }),
    ).rejects.toThrow(BadRequestError);
  });
});
