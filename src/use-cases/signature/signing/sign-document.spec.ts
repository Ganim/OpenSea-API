import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SignDocumentUseCase } from './sign-document';

const TENANT_ID = 'tenant-1';

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let sut: SignDocumentUseCase;

describe('SignDocumentUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    sut = new SignDocumentUseCase(envelopesRepo, signersRepo, auditRepo);
  });

  it('should sign a document via token', async () => {
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
      accessToken: 'valid-token',
      accessTokenExpiresAt: new Date(Date.now() + 86400000),
    });

    await sut.execute({
      accessToken: 'valid-token',
      ipAddress: '127.0.0.1',
      userAgent: 'Test Browser',
    });

    expect(signersRepo.items[0].status).toBe('SIGNED');
    expect(signersRepo.items[0].signedAt).not.toBeNull();
    expect(auditRepo.items).toHaveLength(1);
    expect(auditRepo.items[0].type).toBe('SIGNED');
  });

  it('should complete envelope when all signers sign', async () => {
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
      group: 1,
      accessToken: 'token-1',
      accessTokenExpiresAt: new Date(Date.now() + 86400000),
    });

    await sut.execute({ accessToken: 'token-1' });

    expect(envelopesRepo.items[0].status).toBe('COMPLETED');
  });

  it('should throw on invalid token', async () => {
    await expect(sut.execute({ accessToken: 'invalid' })).rejects.toThrow(
      ResourceNotFoundError,
    );
  });

  it('should throw on already signed', async () => {
    const envelope = await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Test',
      signatureLevel: 'SIMPLE',
      documentFileId: 'f-1',
      documentHash: 'hash',
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
    });

    const signer = await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: envelope.id.toString(),
      signatureLevel: 'SIMPLE',
      accessToken: 'token-signed',
      status: 'SIGNED',
    });

    await expect(sut.execute({ accessToken: 'token-signed' })).rejects.toThrow(
      BadRequestError,
    );
  });
});
