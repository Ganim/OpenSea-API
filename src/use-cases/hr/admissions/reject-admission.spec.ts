import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RejectAdmissionUseCase } from './reject-admission';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: RejectAdmissionUseCase;
const tenantId = 'tenant-123';

describe('Reject Admission Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new RejectAdmissionUseCase(admissionsRepository);
  });

  it('should reject a pending admission invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    const { invite: rejectedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      reason: 'Position no longer available',
    });

    expect(rejectedInvite.status).toBe('CANCELLED');
    expect(
      (rejectedInvite.candidateData as Record<string, unknown>)
        ?.rejectionReason,
    ).toBe('Position no longer available');
  });

  it('should reject an in-progress admission invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'IN_PROGRESS',
      candidateData: { cpf: '123.456.789-09' },
    });

    const { invite: rejectedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      reason: 'Failed background check',
    });

    expect(rejectedInvite.status).toBe('CANCELLED');
    expect(
      (rejectedInvite.candidateData as Record<string, unknown>)
        ?.rejectionReason,
    ).toBe('Failed background check');
    expect((rejectedInvite.candidateData as Record<string, unknown>)?.cpf).toBe(
      '123.456.789-09',
    );
  });

  it('should reject without a reason', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
    });

    const { invite: rejectedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
    });

    expect(rejectedInvite.status).toBe('CANCELLED');
    expect(
      (rejectedInvite.candidateData as Record<string, unknown>)
        ?.rejectionReason,
    ).toBeUndefined();
  });

  it('should throw if invite is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        inviteId: 'non-existent-id',
        reason: 'Some reason',
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should throw if invite is already completed', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Pedro Alves',
      email: 'pedro@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        reason: 'Too late',
      }),
    ).rejects.toThrow('Cannot reject a completed admission');
  });

  it('should throw if invite is already cancelled', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Lucia Ferreira',
      email: 'lucia@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        reason: 'Already gone',
      }),
    ).rejects.toThrow('Cannot reject a cancelled admission');
  });

  it('should preserve existing candidateData when rejecting', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Roberto Dias',
      email: 'roberto@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      candidateData: {
        cpf: '529.982.247-25',
        birthDate: '1990-01-15',
        city: 'Curitiba',
      },
      status: 'IN_PROGRESS',
    });

    const { invite: rejectedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      reason: 'Documents incomplete',
    });

    const candidateData = rejectedInvite.candidateData as Record<
      string,
      unknown
    >;
    expect(candidateData.cpf).toBe('529.982.247-25');
    expect(candidateData.birthDate).toBe('1990-01-15');
    expect(candidateData.city).toBe('Curitiba');
    expect(candidateData.rejectionReason).toBe('Documents incomplete');
  });
});
