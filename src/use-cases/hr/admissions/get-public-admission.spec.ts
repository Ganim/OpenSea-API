import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetPublicAdmissionUseCase } from './get-public-admission';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: GetPublicAdmissionUseCase;
const tenantId = 'tenant-123';

describe('Get Public Admission Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new GetPublicAdmissionUseCase(admissionsRepository);
  });

  it('should return a valid admission invite by token', async () => {
    const createdInvite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      salary: 5000,
      contractType: 'CLT',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    const { invite } = await sut.execute({
      token: createdInvite.token,
    });

    expect(invite.id).toBe(createdInvite.id);
    expect(invite.fullName).toBe('Maria Santos');
    expect(invite.email).toBe('maria@example.com');
    expect(invite.status).toBe('PENDING');
  });

  it('should throw if token is not found', async () => {
    await expect(
      sut.execute({
        token: 'invalid-token',
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should throw if invite is cancelled', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        token: invite.token,
      }),
    ).rejects.toThrow('This admission invite has been cancelled');
  });

  it('should throw if invite is already completed', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Pedro Alves',
      email: 'pedro@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'COMPLETED',
    });

    await expect(
      sut.execute({
        token: invite.token,
      }),
    ).rejects.toThrow('This admission has already been completed');
  });

  it('should throw if invite has expired', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
      expiresAt: expiredDate,
    });

    await expect(
      sut.execute({
        token: invite.token,
      }),
    ).rejects.toThrow('This admission invite has expired');
  });

  it('should return in-progress invite by token', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
      expiresAt: new Date(Date.now() + 86400000 * 7),
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'IN_PROGRESS',
      candidateData: { cpf: '529.982.247-25' },
    });

    const { invite: fetchedInvite } = await sut.execute({
      token: invite.token,
    });

    expect(fetchedInvite.status).toBe('IN_PROGRESS');
    expect(fetchedInvite.candidateData).toEqual({ cpf: '529.982.247-25' });
  });

  it('should work when invite has no expiresAt set', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Lucia Ferreira',
      email: 'lucia@example.com',
    });

    const { invite: fetchedInvite } = await sut.execute({
      token: invite.token,
    });

    expect(fetchedInvite.fullName).toBe('Lucia Ferreira');
    expect(fetchedInvite.expiresAt).toBeNull();
  });
});
