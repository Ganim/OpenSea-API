import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAdmissionInviteUseCase } from './get-admission-invite';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: GetAdmissionInviteUseCase;
const tenantId = 'tenant-123';

describe('Get Admission Invite Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new GetAdmissionInviteUseCase(admissionsRepository);
  });

  it('should return an admission invite by id', async () => {
    const createdInvite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      salary: 5000,
      contractType: 'CLT',
      positionId: 'pos-123',
      departmentId: 'dept-456',
    });

    const { invite } = await sut.execute({
      tenantId,
      inviteId: createdInvite.id,
    });

    expect(invite.id).toBe(createdInvite.id);
    expect(invite.fullName).toBe('Maria Santos');
    expect(invite.email).toBe('maria@example.com');
    expect(invite.salary).toBe(5000);
    expect(invite.contractType).toBe('CLT');
    expect(invite.positionId).toBe('pos-123');
    expect(invite.departmentId).toBe('dept-456');
    expect(invite.token).toBeDefined();
  });

  it('should throw if invite is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        inviteId: 'non-existent-id',
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should not find invite from a different tenant', async () => {
    const createdInvite = await admissionsRepository.create({
      tenantId: 'tenant-other',
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: createdInvite.id,
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should return invite with candidateData when present', async () => {
    const createdInvite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
    });

    await admissionsRepository.update({
      id: createdInvite.id,
      candidateData: {
        cpf: '529.982.247-25',
        birthDate: '1990-05-15',
      },
      status: 'IN_PROGRESS',
    });

    const { invite } = await sut.execute({
      tenantId,
      inviteId: createdInvite.id,
    });

    expect(invite.status).toBe('IN_PROGRESS');
    expect(invite.candidateData).toEqual({
      cpf: '529.982.247-25',
      birthDate: '1990-05-15',
    });
  });
});
