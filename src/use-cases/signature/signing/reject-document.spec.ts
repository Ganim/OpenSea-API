import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectDocumentUseCase } from './reject-document';

const TENANT_ID = 'tenant-1';

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let sut: RejectDocumentUseCase;

describe('RejectDocumentUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    sut = new RejectDocumentUseCase(envelopesRepo, signersRepo, auditRepo);
  });

  it('should reject a document', async () => {
    const envelope = await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Contract',
      signatureLevel: 'SIMPLE',
      documentFileId: 'f-1',
      documentHash: 'hash',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      status: 'PENDING',
    });

    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: envelope.id.toString(),
      signatureLevel: 'SIMPLE',
      accessToken: 'reject-token',
    });

    await sut.execute({
      accessToken: 'reject-token',
      reason: 'I disagree with the terms',
      ipAddress: '127.0.0.1',
    });

    expect(signersRepo.items[0].status).toBe('REJECTED');
    expect(signersRepo.items[0].rejectedReason).toBe(
      'I disagree with the terms',
    );
    expect(envelopesRepo.items[0].status).toBe('REJECTED');
    expect(auditRepo.items[0].type).toBe('REJECTED');
  });

  it('should throw on invalid token', async () => {
    await expect(
      sut.execute({ accessToken: 'invalid', reason: 'test' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
