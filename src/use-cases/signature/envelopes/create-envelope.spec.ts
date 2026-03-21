import { InMemorySignatureEnvelopesRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelopes-repository';
import { InMemorySignatureEnvelopeSignersRepository } from '@/repositories/signature/in-memory/in-memory-signature-envelope-signers-repository';
import { InMemorySignatureAuditEventsRepository } from '@/repositories/signature/in-memory/in-memory-signature-audit-events-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateEnvelopeUseCase } from './create-envelope';

const TENANT_ID = 'tenant-1';

let envelopesRepo: InMemorySignatureEnvelopesRepository;
let signersRepo: InMemorySignatureEnvelopeSignersRepository;
let auditRepo: InMemorySignatureAuditEventsRepository;
let sut: CreateEnvelopeUseCase;

describe('CreateEnvelopeUseCase', () => {
  beforeEach(() => {
    envelopesRepo = new InMemorySignatureEnvelopesRepository();
    signersRepo = new InMemorySignatureEnvelopeSignersRepository();
    auditRepo = new InMemorySignatureAuditEventsRepository();
    sut = new CreateEnvelopeUseCase(envelopesRepo, signersRepo, auditRepo);
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
    expect(auditRepo.items).toHaveLength(1);
    expect(auditRepo.items[0].type).toBe('CREATED');
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
});
