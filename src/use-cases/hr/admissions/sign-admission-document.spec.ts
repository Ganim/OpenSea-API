import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { SignAdmissionDocumentUseCase } from './sign-admission-document';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: SignAdmissionDocumentUseCase;
const tenantId = 'tenant-123';

describe('Sign Admission Document Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new SignAdmissionDocumentUseCase(admissionsRepository);
  });

  it('should create a digital signature for a valid invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const { signature } = await sut.execute({
      token: invite.token,
      signerName: 'Maria Santos',
      signerCpf: '529.982.247-25',
      signerEmail: 'maria@example.com',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      documentHash: 'abc123hash',
      signatureType: 'ADMISSION_CONTRACT',
    });

    expect(signature).toBeDefined();
    expect(signature.id).toBeDefined();
    expect(signature.signerName).toBe('Maria Santos');
    expect(signature.signerCpf).toBe('529.982.247-25');
    expect(signature.signerEmail).toBe('maria@example.com');
    expect(signature.ipAddress).toBe('192.168.1.100');
    expect(signature.documentHash).toBe('abc123hash');
    expect(signature.signatureType).toBe('ADMISSION_CONTRACT');
    expect(signature.tenantId).toBe(tenantId);
    expect(signature.admissionInviteId).toBe(invite.id);
    expect(signature.signedAt).toBeDefined();
  });

  it('should accept DOCUMENT_ACKNOWLEDGMENT signature type', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const { signature } = await sut.execute({
      token: invite.token,
      signerName: 'João Silva',
      ipAddress: '10.0.0.1',
      userAgent: 'Chrome/100',
      documentHash: 'hash456',
      signatureType: 'DOCUMENT_ACKNOWLEDGMENT',
    });

    expect(signature.signatureType).toBe('DOCUMENT_ACKNOWLEDGMENT');
  });

  it('should accept POLICY_ACCEPTANCE signature type', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const { signature } = await sut.execute({
      token: invite.token,
      signerName: 'Ana Costa',
      ipAddress: '10.0.0.2',
      userAgent: 'Firefox/100',
      documentHash: 'hash789',
      signatureType: 'POLICY_ACCEPTANCE',
    });

    expect(signature.signatureType).toBe('POLICY_ACCEPTANCE');
  });

  it('should throw on invalid signature type', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Pedro Alves',
      email: 'pedro@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await expect(
      sut.execute({
        token: invite.token,
        signerName: 'Pedro Alves',
        ipAddress: '10.0.0.3',
        userAgent: 'Safari/16',
        documentHash: 'hashXYZ',
        signatureType: 'INVALID_TYPE',
      }),
    ).rejects.toThrow('Invalid signature type: INVALID_TYPE');
  });

  it('should throw if token is not found', async () => {
    await expect(
      sut.execute({
        token: 'non-existent-token',
        signerName: 'Someone',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome/100',
        documentHash: 'hash',
        signatureType: 'ADMISSION_CONTRACT',
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should throw if invite is cancelled', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        token: invite.token,
        signerName: 'Carlos Lima',
        ipAddress: '10.0.0.4',
        userAgent: 'Chrome/100',
        documentHash: 'hashABC',
        signatureType: 'ADMISSION_CONTRACT',
      }),
    ).rejects.toThrow('This admission invite has been cancelled');
  });

  it('should throw if invite is already completed', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Lucia Ferreira',
      email: 'lucia@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        token: invite.token,
        signerName: 'Lucia Ferreira',
        ipAddress: '10.0.0.5',
        userAgent: 'Chrome/100',
        documentHash: 'hashDEF',
        signatureType: 'ADMISSION_CONTRACT',
      }),
    ).rejects.toThrow('This admission has already been completed');
  });

  it('should throw if invite has expired', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Roberto Dias',
      email: 'roberto@example.com',
      expiresAt: expiredDate,
    });

    await expect(
      sut.execute({
        token: invite.token,
        signerName: 'Roberto Dias',
        ipAddress: '10.0.0.6',
        userAgent: 'Chrome/100',
        documentHash: 'hashGHI',
        signatureType: 'ADMISSION_CONTRACT',
      }),
    ).rejects.toThrow('This admission invite has expired');
  });

  it('should allow signing with optional documentId', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Fernanda Souza',
      email: 'fernanda@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const { signature } = await sut.execute({
      token: invite.token,
      signerName: 'Fernanda Souza',
      ipAddress: '10.0.0.7',
      userAgent: 'Chrome/100',
      documentHash: 'hashJKL',
      signatureType: 'DOCUMENT_ACKNOWLEDGMENT',
      documentId: 'doc-123',
    });

    expect(signature.documentId).toBe('doc-123');
  });

  it('should attach signature to invite in repository', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Marcos Pereira',
      email: 'marcos@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await sut.execute({
      token: invite.token,
      signerName: 'Marcos Pereira',
      ipAddress: '10.0.0.8',
      userAgent: 'Chrome/100',
      documentHash: 'hashMNO',
      signatureType: 'ADMISSION_CONTRACT',
    });

    const updatedInvite = await admissionsRepository.findByToken(invite.token);
    expect(updatedInvite?.signatures).toHaveLength(1);
    expect(updatedInvite?.signatures?.[0].signerName).toBe('Marcos Pereira');
  });
});
