import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCandidatesRepository } from '@/repositories/hr/in-memory/in-memory-candidates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AnonymizeCandidateUseCase } from './anonymize-candidate';

let candidatesRepository: InMemoryCandidatesRepository;
let sut: AnonymizeCandidateUseCase;

const tenantId = new UniqueEntityID().toString();
const actorUserId = new UniqueEntityID().toString();

describe('Anonymize Candidate Use Case', () => {
  beforeEach(() => {
    candidatesRepository = new InMemoryCandidatesRepository();
    sut = new AnonymizeCandidateUseCase(candidatesRepository);
  });

  it('should scrub every PII field', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'Maria Oliveira',
      email: 'maria.oliveira@example.com',
      phone: '+5511988887777',
      cpf: '529.982.247-25',
      resumeUrl: 'https://example.com/resume.pdf',
      linkedinUrl: 'https://linkedin.com/in/maria',
      notes: 'very promising candidate',
      tags: ['senior', 'backend'],
    });

    const { candidate, alreadyAnonymized } = await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
      actorUserId,
    });

    expect(alreadyAnonymized).toBe(false);
    expect(candidate.isAnonymized).toBe(true);
    expect(candidate.fullName).toMatch(/^ANONIMIZADO-[a-z0-9]{8}$/i);
    expect(candidate.email).toMatch(/^anon-[a-z0-9]{8}@redacted\.local$/i);
    expect(candidate.cpf).toBeUndefined();
    expect(candidate.phone).toBeUndefined();
    expect(candidate.resumeUrl).toBeUndefined();
    expect(candidate.linkedinUrl).toBeUndefined();
    expect(candidate.notes).toBeUndefined();
    expect(candidate.tags).toBeUndefined();
    expect(candidate.anonymizedAt).toBeInstanceOf(Date);
    expect(candidate.anonymizedBy).toBe(actorUserId);
  });

  it('should preserve the funnel-analytics fields (source, createdAt)', async () => {
    const createdAtReference = new Date('2025-01-15T10:00:00Z');
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao.silva@example.com',
      source: 'LINKEDIN',
    });
    // Force a known createdAt for the assertion below.
    created.props.createdAt = createdAtReference;

    const { candidate } = await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
      actorUserId,
    });

    expect(candidate.source).toBe('LINKEDIN');
    expect(candidate.createdAt).toEqual(createdAtReference);
  });

  it('should be idempotent — second call does not overwrite the timestamp', async () => {
    const created = await candidatesRepository.create({
      tenantId,
      fullName: 'Carla Mendes',
      email: 'carla.mendes@example.com',
      cpf: '529.982.247-25',
    });

    const first = await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
      actorUserId,
    });
    const firstTimestamp = first.candidate.anonymizedAt;

    const second = await sut.execute({
      tenantId,
      candidateId: created.id.toString(),
      actorUserId: new UniqueEntityID().toString(),
    });

    expect(second.alreadyAnonymized).toBe(true);
    expect(second.candidate.anonymizedAt).toEqual(firstTimestamp);
    // First actor wins — idempotency preserves the original audit trail.
    expect(second.candidate.anonymizedBy).toBe(actorUserId);
  });

  it('should throw 404 when the candidate does not exist', async () => {
    await expect(
      sut.execute({
        tenantId,
        candidateId: new UniqueEntityID().toString(),
        actorUserId,
      }),
    ).rejects.toThrow('Candidato não encontrado');
  });

  it('should enforce tenant isolation — cannot anonymize across tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    const created = await candidatesRepository.create({
      tenantId: otherTenantId,
      fullName: 'Other Tenant Candidate',
      email: 'other@example.com',
    });

    await expect(
      sut.execute({
        tenantId,
        candidateId: created.id.toString(),
        actorUserId,
      }),
    ).rejects.toThrow('Candidato não encontrado');
  });
});
