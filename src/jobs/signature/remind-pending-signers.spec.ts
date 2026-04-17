import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    $disconnect: vi.fn().mockResolvedValue(undefined),
  },
}));

// Stub the email service — the spec drives the ResendNotificationsUseCase
// through an injected test double, so the real SMTP/nodemailer stack
// (which otherwise validates env vars at import time) must be short-circuited.
vi.mock('@/services/signature/signature-email-service', () => ({
  SignatureEmailService: vi.fn().mockImplementation(() => ({
    sendSignatureRequest: vi.fn(),
    sendOTP: vi.fn(),
    sendReminder: vi.fn(),
    sendCompletionConfirmation: vi.fn(),
  })),
}));

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import type { ResendNotificationsUseCase } from '@/use-cases/signature/envelopes/resend-notifications';
import { remindPendingSigners } from './remind-pending-signers';

const TENANT_ID = 'tenant-signature-remind';
const MS_PER_DAY = 24 * 60 * 60 * 1000;

describe('remindPendingSigners (Phase 4 cron)', () => {
  let envelopesRepository: InMemorySignatureEnvelopesRepository;
  let signersRepository: InMemorySignatureEnvelopeSignersRepository;
  let auditEventsRepository: InMemorySignatureAuditEventsRepository;
  let resendExecuteSpy: ReturnType<typeof vi.fn>;
  let resendUseCase: ResendNotificationsUseCase;

  beforeEach(() => {
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    signersRepository = new InMemorySignatureEnvelopeSignersRepository();
    auditEventsRepository = new InMemorySignatureAuditEventsRepository();
    resendExecuteSpy = vi
      .fn()
      .mockImplementation(async ({ envelopeId }: { envelopeId: string }) => {
        const signers = await signersRepository.findByEnvelopeId(envelopeId);
        const pending = signers.filter(
          (signer) =>
            !['SIGNED', 'REJECTED', 'EXPIRED'].includes(signer.status),
        );
        return {
          notifiedCount: pending.length,
          emailDeliveryErrors: [],
        };
      });
    resendUseCase = {
      execute: resendExecuteSpy,
    } as unknown as ResendNotificationsUseCase;
  });

  function seedEnvelope(overrides: {
    id: string;
    status: SignatureEnvelope['status'];
    expiresAt: Date | null;
    reminderDays?: number;
  }): SignatureEnvelope {
    const envelope = SignatureEnvelope.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        title: `Envelope ${overrides.id}`,
        description: null,
        status: overrides.status,
        signatureLevel: 'SIMPLE',
        minSignatureLevel: null,
        verificationCode: null,
        documentFileId: 'file-1',
        documentHash: 'hash-1',
        signedFileId: null,
        documentType: 'PDF',
        sourceModule: 'tools',
        sourceEntityType: 'manual',
        sourceEntityId: 'manual-1',
        routingType: 'PARALLEL',
        expiresAt: overrides.expiresAt,
        reminderDays: overrides.reminderDays ?? 3,
        autoExpireDays: 7,
        completedAt: null,
        cancelledAt: null,
        cancelReason: null,
        createdByUserId: 'user-creator',
        tags: [],
        metadata: null,
        deletedAt: null,
      },
      new UniqueEntityID(overrides.id),
    );
    envelopesRepository.items.push(envelope);
    return envelope;
  }

  function seedSigner(overrides: {
    id: string;
    envelopeId: string;
    status: SignatureEnvelopeSigner['status'];
    lastNotifiedAt?: Date | null;
    externalEmail?: string | null;
  }): SignatureEnvelopeSigner {
    const signer = SignatureEnvelopeSigner.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        envelopeId: overrides.envelopeId,
        status: overrides.status,
        signatureLevel: 'SIMPLE',
        externalEmail:
          overrides.externalEmail === undefined
            ? 'signer@example.com'
            : overrides.externalEmail,
        externalName: 'Signer',
        accessToken: 'tok-abc',
        lastNotifiedAt: overrides.lastNotifiedAt ?? null,
      },
      new UniqueEntityID(overrides.id),
    );
    signersRepository.items.push(signer);
    return signer;
  }

  it('invokes ResendNotificationsUseCase for envelopes with signers past the reminder cadence', async () => {
    const referenceDate = new Date('2026-04-17T12:00:00.000Z');

    // Envelope A — signer never notified. Qualifies.
    seedEnvelope({
      id: 'env-a',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
      reminderDays: 3,
    });
    seedSigner({
      id: 'signer-a',
      envelopeId: 'env-a',
      status: 'PENDING',
      lastNotifiedAt: null,
    });

    // Envelope B — notified 5 days ago, cadence is 3 → qualifies.
    seedEnvelope({
      id: 'env-b',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
      reminderDays: 3,
    });
    seedSigner({
      id: 'signer-b',
      envelopeId: 'env-b',
      status: 'NOTIFIED',
      lastNotifiedAt: new Date(referenceDate.getTime() - 5 * MS_PER_DAY),
    });

    // Envelope C — notified yesterday, cadence is 3 → NOT due.
    seedEnvelope({
      id: 'env-c',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
      reminderDays: 3,
    });
    seedSigner({
      id: 'signer-c',
      envelopeId: 'env-c',
      status: 'VIEWED',
      lastNotifiedAt: new Date(referenceDate.getTime() - 1 * MS_PER_DAY),
    });

    // Envelope D — already past expiresAt, the repo filters it out upstream.
    seedEnvelope({
      id: 'env-d',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-d',
      envelopeId: 'env-d',
      status: 'PENDING',
    });

    // Envelope E — DRAFT status, not actionable.
    seedEnvelope({
      id: 'env-e',
      status: 'DRAFT',
      expiresAt: null,
    });
    seedSigner({
      id: 'signer-e',
      envelopeId: 'env-e',
      status: 'PENDING',
    });

    const result = await remindPendingSigners({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
        resendNotificationsUseCase: resendUseCase,
      },
    });

    expect(result.remindedEnvelopes).toBe(2);
    expect(result.totalSigners).toBe(2);

    const remindedEnvelopeIds = result.details
      .map((entry) => entry.envelopeId)
      .sort();
    expect(remindedEnvelopeIds).toEqual(['env-a', 'env-b']);

    expect(resendExecuteSpy).toHaveBeenCalledTimes(2);
    expect(resendExecuteSpy).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      envelopeId: 'env-a',
    });
    expect(resendExecuteSpy).toHaveBeenCalledWith({
      tenantId: TENANT_ID,
      envelopeId: 'env-b',
    });
  });

  it('skips envelopes where every signer is terminal or lacks email', async () => {
    const referenceDate = new Date('2026-04-17T12:00:00.000Z');

    seedEnvelope({
      id: 'env-only-signed',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-signed',
      envelopeId: 'env-only-signed',
      status: 'SIGNED',
      lastNotifiedAt: new Date(referenceDate.getTime() - 10 * MS_PER_DAY),
    });

    seedEnvelope({
      id: 'env-no-email',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-internal',
      envelopeId: 'env-no-email',
      status: 'PENDING',
      externalEmail: null,
    });

    const result = await remindPendingSigners({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
        resendNotificationsUseCase: resendUseCase,
      },
    });

    expect(result.remindedEnvelopes).toBe(0);
    expect(resendExecuteSpy).not.toHaveBeenCalled();
  });

  it('uses envelope.reminderDays for the cadence threshold', async () => {
    const referenceDate = new Date('2026-04-17T12:00:00.000Z');

    // Envelope with 7-day cadence — a signer notified 5 days ago is NOT due.
    seedEnvelope({
      id: 'env-slow',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-10T00:00:00.000Z'),
      reminderDays: 7,
    });
    seedSigner({
      id: 'signer-slow',
      envelopeId: 'env-slow',
      status: 'NOTIFIED',
      lastNotifiedAt: new Date(referenceDate.getTime() - 5 * MS_PER_DAY),
    });

    // Envelope with 1-day cadence — same 5-day gap qualifies.
    seedEnvelope({
      id: 'env-fast',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-10T00:00:00.000Z'),
      reminderDays: 1,
    });
    seedSigner({
      id: 'signer-fast',
      envelopeId: 'env-fast',
      status: 'NOTIFIED',
      lastNotifiedAt: new Date(referenceDate.getTime() - 5 * MS_PER_DAY),
    });

    const result = await remindPendingSigners({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
        resendNotificationsUseCase: resendUseCase,
      },
    });

    expect(result.remindedEnvelopes).toBe(1);
    expect(result.details[0].envelopeId).toBe('env-fast');
  });

  it('continues when a single envelope reminder throws', async () => {
    const referenceDate = new Date('2026-04-17T12:00:00.000Z');

    seedEnvelope({
      id: 'env-broken',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-broken',
      envelopeId: 'env-broken',
      status: 'PENDING',
    });

    seedEnvelope({
      id: 'env-ok',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-01T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-ok',
      envelopeId: 'env-ok',
      status: 'PENDING',
    });

    resendExecuteSpy.mockImplementation(async ({ envelopeId }) => {
      if (envelopeId === 'env-broken') {
        throw new Error('email provider down');
      }
      return { notifiedCount: 1, emailDeliveryErrors: [] };
    });

    const result = await remindPendingSigners({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
        resendNotificationsUseCase: resendUseCase,
      },
    });

    expect(result.remindedEnvelopes).toBe(1);
    expect(result.details[0].envelopeId).toBe('env-ok');
  });

  it('returns an empty summary when there are no in-progress envelopes', async () => {
    const referenceDate = new Date('2026-04-17T12:00:00.000Z');

    const result = await remindPendingSigners({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
        resendNotificationsUseCase: resendUseCase,
      },
    });

    expect(result).toEqual({
      remindedEnvelopes: 0,
      totalSigners: 0,
      details: [],
    });
    expect(resendExecuteSpy).not.toHaveBeenCalled();
  });
});
