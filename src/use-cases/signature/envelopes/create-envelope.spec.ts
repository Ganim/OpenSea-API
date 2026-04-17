import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import type { SignatureEmailService } from '@/services/signature/signature-email-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateEnvelopeUseCase } from './create-envelope';

const TENANT_ID = 'tenant-1';

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let emailServiceMock: {
  sendSignatureRequest: ReturnType<typeof vi.fn>;
  sendOTP: ReturnType<typeof vi.fn>;
  sendReminder: ReturnType<typeof vi.fn>;
  sendCompletionConfirmation: ReturnType<typeof vi.fn>;
};
let sut: CreateEnvelopeUseCase;

function makeEmailServiceMock() {
  return {
    sendSignatureRequest: vi.fn().mockResolvedValue({ success: true }),
    sendOTP: vi.fn().mockResolvedValue({ success: true }),
    sendReminder: vi.fn().mockResolvedValue({ success: true }),
    sendCompletionConfirmation: vi.fn().mockResolvedValue({ success: true }),
  };
}

describe('CreateEnvelopeUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    emailServiceMock = makeEmailServiceMock();
    sut = new CreateEnvelopeUseCase(
      envelopesRepo,
      signersRepo,
      auditRepo,
      emailServiceMock as unknown as SignatureEmailService,
    );
  });

  it('should create an envelope with signers', async () => {
    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      title: 'Contrato de Venda #123',
      signatureLevel: 'ADVANCED',
      documentFileId: 'file-1',
      documentHash: 'abc123hash',
      sourceModule: 'sales',
      sourceEntityType: 'proposal',
      sourceEntityId: 'proposal-1',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
      signers: [
        {
          userId: 'user-1',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'ADVANCED',
        },
        {
          externalName: 'Cliente Externo',
          externalEmail: 'cliente@example.com',
          order: 2,
          group: 2,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    expect(envelope.title).toBe('Contrato de Venda #123');
    expect(envelope.status).toBe('DRAFT');
    expect(envelopesRepo.items).toHaveLength(1);
    expect(signersRepo.items).toHaveLength(2);
    // One CREATED + one SENT (for the single external signer)
    expect(auditRepo.items).toHaveLength(2);
    expect(auditRepo.items.map((e) => e.type)).toContain('CREATED');
    expect(auditRepo.items.map((e) => e.type)).toContain('SENT');
  });

  it('should generate access tokens for external signers', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      title: 'Contract',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      signers: [
        {
          externalEmail: 'ext@example.com',
          externalName: 'External',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    const signer = signersRepo.items[0];
    expect(signer.accessToken).not.toBeNull();
    expect(signer.accessTokenExpiresAt).not.toBeNull();
  });

  it('should not generate access token for internal users', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      title: 'Internal Doc',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'hr',
      sourceEntityType: 'contract',
      sourceEntityId: 'hr-1',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
      signers: [
        {
          userId: 'user-2',
          order: 1,
          group: 1,
          role: 'APPROVER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    const signer = signersRepo.items[0];
    expect(signer.accessToken).toBeNull();
  });

  it('should generate a unique human-legible verification code for the envelope', async () => {
    const { envelope } = await sut.execute({
      tenantId: TENANT_ID,
      title: 'Contract with Code',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'sales',
      sourceEntityType: 'proposal',
      sourceEntityId: 'p-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      signers: [
        {
          externalName: 'External Signer',
          externalEmail: 'ext@example.com',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    expect(envelope.verificationCode).not.toBeNull();
    expect(envelope.verificationCode).toHaveLength(10);
    // Legible alphabet: no I, O, 0, 1
    expect(envelope.verificationCode).toMatch(
      /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/,
    );
  });

  it('should send signature request email to each external signer', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      title: 'Multi-signer Contract',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      expiresAt: new Date('2027-01-01T00:00:00Z'),
      signers: [
        {
          externalName: 'External One',
          externalEmail: 'one@example.com',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
        {
          externalName: 'External Two',
          externalEmail: 'two@example.com',
          order: 2,
          group: 2,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
        {
          userId: 'user-3',
          order: 3,
          group: 3,
          role: 'APPROVER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    expect(emailServiceMock.sendSignatureRequest).toHaveBeenCalledTimes(2);
    expect(emailServiceMock.sendSignatureRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'one@example.com',
        envelopeTitle: 'Multi-signer Contract',
        signerName: 'External One',
        expiresAt: new Date('2027-01-01T00:00:00Z'),
      }),
    );
    expect(emailServiceMock.sendSignatureRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'two@example.com',
        signerName: 'External Two',
      }),
    );
  });

  it('should emit SENT audit events for each successful email delivery', async () => {
    await sut.execute({
      tenantId: TENANT_ID,
      title: 'Audit Trail Test',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      signers: [
        {
          externalName: 'External Signer',
          externalEmail: 'ext@example.com',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    const createdEvents = auditRepo.items.filter((e) => e.type === 'CREATED');
    const sentEvents = auditRepo.items.filter((e) => e.type === 'SENT');
    expect(createdEvents).toHaveLength(1);
    expect(sentEvents).toHaveLength(1);
  });

  it('should not fail the envelope creation when an email delivery fails', async () => {
    emailServiceMock.sendSignatureRequest.mockResolvedValueOnce({
      success: false,
      message: 'SMTP connection refused',
    });

    const { envelope, emailDeliveryErrors } = await sut.execute({
      tenantId: TENANT_ID,
      title: 'Resilient Envelope',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      signers: [
        {
          externalName: 'Failing Recipient',
          externalEmail: 'fail@example.com',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    expect(envelope).toBeDefined();
    expect(envelopesRepo.items).toHaveLength(1);
    expect(emailDeliveryErrors).toHaveLength(1);
    expect(emailDeliveryErrors[0]).toContain('fail@example.com');
  });

  it('should work without an email service injected', async () => {
    const sutWithoutEmail = new CreateEnvelopeUseCase(
      envelopesRepo,
      signersRepo,
      auditRepo,
    );

    const { envelope, emailDeliveryErrors } = await sutWithoutEmail.execute({
      tenantId: TENANT_ID,
      title: 'No email service',
      signatureLevel: 'SIMPLE',
      documentFileId: 'file-1',
      documentHash: 'hash123',
      sourceModule: 'hr',
      sourceEntityType: 'contract',
      sourceEntityId: 'hr-2',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
      signers: [
        {
          externalName: 'Skip Email',
          externalEmail: 'skip@example.com',
          order: 1,
          group: 1,
          role: 'SIGNER',
          signatureLevel: 'SIMPLE',
        },
      ],
    });

    expect(envelope).toBeDefined();
    expect(emailDeliveryErrors).toEqual([]);
  });
});
