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

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureEnvelope } from '@/entities/signature/signature-envelope';
import { SignatureEnvelopeSigner } from '@/entities/signature/signature-envelope-signer';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { expireSignatureEnvelopes } from './expire-envelopes';

const TENANT_ID = 'tenant-signature-cron';

describe('expireSignatureEnvelopes (Phase 4 cron)', () => {
  let envelopesRepository: InMemorySignatureEnvelopesRepository;
  let signersRepository: InMemorySignatureEnvelopeSignersRepository;
  let auditEventsRepository: InMemorySignatureAuditEventsRepository;

  beforeEach(() => {
    envelopesRepository = new InMemorySignatureEnvelopesRepository();
    signersRepository = new InMemorySignatureEnvelopeSignersRepository();
    auditEventsRepository = new InMemorySignatureAuditEventsRepository();
  });

  function seedEnvelope(overrides: {
    id: string;
    status: SignatureEnvelope['status'];
    expiresAt: Date | null;
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
        reminderDays: 3,
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
  }): SignatureEnvelopeSigner {
    const signer = SignatureEnvelopeSigner.create(
      {
        tenantId: new UniqueEntityID(TENANT_ID),
        envelopeId: overrides.envelopeId,
        status: overrides.status,
        signatureLevel: 'SIMPLE',
        externalEmail: 'signer@example.com',
        externalName: 'Signer',
        accessToken: 'tok-abc',
      },
      new UniqueEntityID(overrides.id),
    );
    signersRepository.items.push(signer);
    return signer;
  }

  it('expires only PENDING/IN_PROGRESS envelopes with past expiresAt', async () => {
    const referenceDate = new Date('2026-04-17T05:00:00.000Z');

    const pastDue = seedEnvelope({
      id: 'env-past',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-past-pending',
      envelopeId: 'env-past',
      status: 'PENDING',
    });
    seedSigner({
      id: 'signer-past-signed',
      envelopeId: 'env-past',
      status: 'SIGNED',
    });

    const futureDue = seedEnvelope({
      id: 'env-future',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-05-20T00:00:00.000Z'),
    });
    seedSigner({
      id: 'signer-future',
      envelopeId: 'env-future',
      status: 'PENDING',
    });

    const completedPastDue = seedEnvelope({
      id: 'env-completed',
      status: 'COMPLETED',
      expiresAt: new Date('2026-03-01T00:00:00.000Z'),
    });

    const result = await expireSignatureEnvelopes({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
      },
    });

    expect(result.expiredCount).toBe(1);
    expect(result.details).toEqual([
      { envelopeId: 'env-past', tenantId: TENANT_ID },
    ]);

    expect(pastDue.status).toBe('EXPIRED');
    expect(pastDue.cancelledAt).toEqual(referenceDate);

    // Future and already-completed envelopes stay untouched.
    expect(futureDue.status).toBe('IN_PROGRESS');
    expect(completedPastDue.status).toBe('COMPLETED');

    // Pending signer flipped to EXPIRED, already-signed signer preserved.
    const pastEnvelopeSigners =
      await signersRepository.findByEnvelopeId('env-past');
    const pendingSigner = pastEnvelopeSigners.find(
      (signer) => signer.signerId.toString() === 'signer-past-pending',
    );
    const signedSigner = pastEnvelopeSigners.find(
      (signer) => signer.signerId.toString() === 'signer-past-signed',
    );
    expect(pendingSigner?.status).toBe('EXPIRED');
    expect(signedSigner?.status).toBe('SIGNED');

    // Audit event emitted exactly once.
    const auditEvents =
      await auditEventsRepository.findByEnvelopeId('env-past');
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0].type).toBe('EXPIRED');
  });

  it('returns zero-count result when there is nothing to expire', async () => {
    const referenceDate = new Date('2026-04-17T05:00:00.000Z');

    seedEnvelope({
      id: 'env-safe',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-06-01T00:00:00.000Z'),
    });

    const result = await expireSignatureEnvelopes({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
      },
    });

    expect(result.expiredCount).toBe(0);
    expect(result.details).toHaveLength(0);
    expect(auditEventsRepository.items).toHaveLength(0);
  });

  it('is idempotent — a second run after expiration yields no further writes', async () => {
    const referenceDate = new Date('2026-04-17T05:00:00.000Z');

    seedEnvelope({
      id: 'env-idempotent',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-04-10T00:00:00.000Z'),
    });

    const firstRun = await expireSignatureEnvelopes({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
      },
    });
    expect(firstRun.expiredCount).toBe(1);

    const secondRun = await expireSignatureEnvelopes({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
      },
    });
    expect(secondRun.expiredCount).toBe(0);
    expect(auditEventsRepository.items).toHaveLength(1);
  });

  it('skips envelopes with null expiresAt', async () => {
    const referenceDate = new Date('2026-04-17T05:00:00.000Z');

    seedEnvelope({
      id: 'env-no-expiry',
      status: 'IN_PROGRESS',
      expiresAt: null,
    });

    const result = await expireSignatureEnvelopes({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
      },
    });

    expect(result.expiredCount).toBe(0);
  });

  it('continues expiring remaining envelopes when one fails', async () => {
    const referenceDate = new Date('2026-04-17T05:00:00.000Z');

    seedEnvelope({
      id: 'env-broken',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-04-10T00:00:00.000Z'),
    });
    seedEnvelope({
      id: 'env-healthy',
      status: 'IN_PROGRESS',
      expiresAt: new Date('2026-04-11T00:00:00.000Z'),
    });

    const originalUpdate = envelopesRepository.update.bind(envelopesRepository);
    const updateSpy = vi
      .spyOn(envelopesRepository, 'update')
      .mockImplementation(async (data) => {
        if (data.id === 'env-broken') {
          throw new Error('transient db error');
        }
        return originalUpdate(data);
      });

    const result = await expireSignatureEnvelopes({
      referenceDate,
      dependencies: {
        envelopesRepository,
        signersRepository,
        auditEventsRepository,
      },
    });

    expect(result.expiredCount).toBe(1);
    expect(result.details[0].envelopeId).toBe('env-healthy');
    updateSpy.mockRestore();
  });
});
