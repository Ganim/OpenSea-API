import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { VerifySignatureByCodeUseCase } from './verify-signature-by-code';

const TENANT_ID = 'tenant-1';

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let sut: VerifySignatureByCodeUseCase;

describe('VerifySignatureByCodeUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    sut = new VerifySignatureByCodeUseCase(envelopesRepo, signersRepo);
  });

  it('should return envelope details with signers for a valid code', async () => {
    const envelope = await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Contract',
      signatureLevel: 'ADVANCED',
      verificationCode: 'VERIFY12345',
      documentFileId: 'file-1',
      documentHash: 'a'.repeat(64),
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      status: 'COMPLETED',
    });

    await signersRepo.create({
      tenantId: TENANT_ID,
      envelopeId: envelope.id.toString(),
      signatureLevel: 'ADVANCED',
      externalName: 'Jane Signer',
      status: 'SIGNED',
    });
    signersRepo.items[0].props.signedAt = new Date('2026-04-17T12:00:00Z');

    const response = await sut.execute({ verificationCode: 'VERIFY12345' });

    expect(response.status).toBe('COMPLETED');
    expect(response.envelopeTitle).toBe('Contract');
    expect(response.verificationCode).toBe('VERIFY12345');
    expect(response.documentHash).toBe('a'.repeat(64));
    expect(response.isValid).toBe(true);
    expect(response.signers).toHaveLength(1);
    expect(response.signers[0].name).toBe('Jane Signer');
    expect(response.signers[0].status).toBe('SIGNED');
  });

  it('should return isValid=false for non-completed envelopes', async () => {
    await envelopesRepo.create({
      tenantId: TENANT_ID,
      title: 'Pending Contract',
      signatureLevel: 'ADVANCED',
      verificationCode: 'PEND12345',
      documentFileId: 'file-1',
      documentHash: 'a'.repeat(64),
      sourceModule: 'sales',
      sourceEntityType: 'contract',
      sourceEntityId: 'c-1',
      routingType: 'PARALLEL',
      createdByUserId: 'user-1',
      status: 'PENDING',
    });

    const response = await sut.execute({ verificationCode: 'PEND12345' });

    expect(response.status).toBe('PENDING');
    expect(response.isValid).toBe(false);
  });

  it('should throw ResourceNotFoundError for unknown code', async () => {
    await expect(
      sut.execute({ verificationCode: 'DOES-NOT-EXIST' }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
