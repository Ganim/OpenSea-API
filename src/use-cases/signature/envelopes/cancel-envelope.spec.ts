import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelEnvelopeUseCase } from './cancel-envelope';

const TENANT_ID = 'tenant-1';

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let sut: CancelEnvelopeUseCase;

describe('CancelEnvelopeUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    sut = new CancelEnvelopeUseCase(envelopesRepo, signersRepo, auditRepo);
  });

  it('should cancel an envelope', async () => {
    const envelope = await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Test Envelope',
      signatureLevel: 'SIMPLE',
      documentFileId: 'f-1',
      documentHash: 'hash',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
      status: 'PENDING',
    });

    await sut.execute({
      tenantId: TENANT_ID,
      envelopeId: envelope.id.toString(),
      reason: 'No longer needed',
    });

    const updated = envelopesRepo.items[0];
    expect(updated.status).toBe('CANCELLED');
    expect(updated.cancelReason).toBe('No longer needed');
    expect(auditRepo.items).toHaveLength(1);
    expect(auditRepo.items[0].type).toBe('CANCELLED');
  });

  it('should throw on completed envelope', async () => {
    const envelope = await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Done',
      signatureLevel: 'SIMPLE',
      documentFileId: 'f-1',
      documentHash: 'hash',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'SEQUENTIAL',
      createdByUserId: 'user-1',
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        envelopeId: envelope.id.toString(),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when not found', async () => {
    await expect(
      sut.execute({ tenantId: TENANT_ID, envelopeId: 'non-existent' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
