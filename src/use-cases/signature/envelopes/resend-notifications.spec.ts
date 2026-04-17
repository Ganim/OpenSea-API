import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { SignatureEmailService } from '@/services/signature/signature-email-service';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ResendNotificationsUseCase } from './resend-notifications';

const tenantId = 'tenant-1';
const envelopeId = 'envelope-1';

function makeMocks() {
  const envelopesRepository = {
    findById: vi.fn(),
  } as unknown;

  const signersRepository = {
    findByEnvelopeId: vi.fn(),
    update: vi.fn(),
  } as unknown;

  const auditEventsRepository = {
    create: vi.fn(),
  } as unknown;

  const signatureEmailService = {
    sendSignatureRequest: vi.fn().mockResolvedValue({ success: true }),
    sendOTP: vi.fn().mockResolvedValue({ success: true }),
    sendReminder: vi.fn().mockResolvedValue({ success: true }),
    sendCompletionConfirmation: vi.fn().mockResolvedValue({ success: true }),
  };

  const sut = new ResendNotificationsUseCase(
    envelopesRepository,
    signersRepository,
    auditEventsRepository,
    signatureEmailService as unknown as SignatureEmailService,
  );

  return {
    sut,
    envelopesRepository,
    signersRepository,
    auditEventsRepository,
    signatureEmailService,
  };
}

describe('ResendNotificationsUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should resend notifications to pending signers', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
      title: 'Contract',
      expiresAt: null,
    });

    const signers = [
      {
        id: new UniqueEntityID('s-1'),
        status: 'PENDING',
        notificationCount: 1,
        lastNotifiedAt: new Date(),
        userId: null,
        externalEmail: 'a@example.com',
        accessToken: 'token-a',
        displayName: 'Signer A',
      },
      {
        id: new UniqueEntityID('s-2'),
        status: 'WAITING',
        notificationCount: 0,
        lastNotifiedAt: null,
        userId: null,
        externalEmail: 'b@example.com',
        accessToken: 'token-b',
        displayName: 'Signer B',
      },
      {
        id: new UniqueEntityID('s-3'),
        status: 'SIGNED',
        notificationCount: 2,
        lastNotifiedAt: new Date(),
        userId: null,
        externalEmail: 'c@example.com',
        accessToken: 'token-c',
        displayName: 'Signer C',
      },
    ];

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue(signers);
    mocks.signersRepository.update.mockResolvedValue({});
    mocks.auditEventsRepository.create.mockResolvedValue({});

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(2);
    expect(mocks.signersRepository.update).toHaveBeenCalledTimes(2);
    expect(mocks.signersRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 's-1',
        notificationCount: 2,
      }),
    );
    expect(mocks.signersRepository.update).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 's-2',
        notificationCount: 1,
      }),
    );
    expect(mocks.auditEventsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'REMINDED',
        envelopeId,
      }),
    );
    expect(mocks.signatureEmailService.sendReminder).toHaveBeenCalledTimes(2);
    expect(mocks.signatureEmailService.sendReminder).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@example.com',
        signerName: 'Signer A',
        envelopeTitle: 'Contract',
      }),
    );
  });

  it('should compute daysRemaining correctly when envelope has expiresAt', async () => {
    const expiresAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
      title: 'Expiring Contract',
      expiresAt,
    });

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue([
      {
        id: new UniqueEntityID('s-1'),
        status: 'PENDING',
        notificationCount: 0,
        userId: null,
        externalEmail: 'due@example.com',
        accessToken: 'token-due',
        displayName: 'Signer Due',
      },
    ]);

    await mocks.sut.execute({ tenantId, envelopeId });

    const call = mocks.signatureEmailService.sendReminder.mock.calls[0]![0];
    expect(call.daysRemaining).toBeGreaterThanOrEqual(4);
    expect(call.daysRemaining).toBeLessThanOrEqual(5);
  });

  it('should collect email delivery errors without failing the use case', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
      title: 'Unreachable Envelope',
      expiresAt: null,
    });

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue([
      {
        id: new UniqueEntityID('s-1'),
        status: 'PENDING',
        notificationCount: 0,
        userId: null,
        externalEmail: 'fail@example.com',
        accessToken: 'token-fail',
        displayName: 'Signer Fail',
      },
    ]);

    mocks.signatureEmailService.sendReminder.mockResolvedValueOnce({
      success: false,
      message: 'SMTP down',
    });

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(1);
    expect(result.emailDeliveryErrors).toHaveLength(1);
    expect(result.emailDeliveryErrors[0]).toContain('fail@example.com');
  });

  it('should not create audit event when no pending signers exist', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
    });

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue([
      { id: new UniqueEntityID('s-1'), status: 'SIGNED', notificationCount: 1 },
      {
        id: new UniqueEntityID('s-2'),
        status: 'REJECTED',
        notificationCount: 1,
      },
    ]);

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(0);
    expect(mocks.signersRepository.update).not.toHaveBeenCalled();
    expect(mocks.auditEventsRepository.create).not.toHaveBeenCalled();
  });

  it('should throw ResourceNotFoundError when envelope does not exist', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, envelopeId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should filter out EXPIRED signers', async () => {
    mocks.envelopesRepository.findById.mockResolvedValue({
      id: new UniqueEntityID(envelopeId),
    });

    mocks.signersRepository.findByEnvelopeId.mockResolvedValue([
      {
        id: new UniqueEntityID('s-1'),
        status: 'EXPIRED',
        notificationCount: 3,
      },
    ]);

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.notifiedCount).toBe(0);
  });
});
