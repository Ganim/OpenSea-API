import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateAdmissionInviteUseCase } from './update-admission-invite';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: UpdateAdmissionInviteUseCase;
const tenantId = 'tenant-123';

describe('Update Admission Invite Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new UpdateAdmissionInviteUseCase(admissionsRepository);
  });

  it('should update a pending admission invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
      salary: 5000,
    });

    const { invite: updatedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      salary: 6000,
      fullName: 'Maria Santos Silva',
      contractType: 'PJ',
    });

    expect(updatedInvite.salary).toBe(6000);
    expect(updatedInvite.fullName).toBe('Maria Santos Silva');
    expect(updatedInvite.contractType).toBe('PJ');
    expect(updatedInvite.email).toBe('maria@example.com');
  });

  it('should update an in-progress admission invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'IN_PROGRESS',
    });

    const { invite: updatedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      positionId: 'pos-456',
      departmentId: 'dept-789',
    });

    expect(updatedInvite.positionId).toBe('pos-456');
    expect(updatedInvite.departmentId).toBe('dept-789');
    expect(updatedInvite.status).toBe('IN_PROGRESS');
  });

  it('should throw if invite is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        inviteId: 'non-existent-id',
        fullName: 'New Name',
      }),
    ).rejects.toThrow('Admission invite not found');
  });

  it('should throw if invite is completed', async () => {
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
        salary: 8000,
      }),
    ).rejects.toThrow('Only PENDING or IN_PROGRESS invites can be edited');
  });

  it('should throw if invite is cancelled', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Ana Costa',
      email: 'ana@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'CANCELLED',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        salary: 7000,
      }),
    ).rejects.toThrow('Only PENDING or IN_PROGRESS invites can be edited');
  });

  it('should throw if invite is expired', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'EXPIRED',
    });

    await expect(
      sut.execute({
        tenantId,
        inviteId: invite.id,
        salary: 9000,
      }),
    ).rejects.toThrow('Only PENDING or IN_PROGRESS invites can be edited');
  });

  it('should allow setting fields to null', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Lucia Ferreira',
      email: 'lucia@example.com',
      salary: 5000,
      positionId: 'pos-123',
      departmentId: 'dept-456',
    });

    const { invite: updatedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      positionId: null,
      departmentId: null,
      salary: null,
    });

    expect(updatedInvite.positionId).toBeNull();
    expect(updatedInvite.departmentId).toBeNull();
    expect(updatedInvite.salary).toBeNull();
  });

  it('should update expectedStartDate', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Roberto Dias',
      email: 'roberto@example.com',
    });

    const newStartDate = new Date('2026-06-01');

    const { invite: updatedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      expectedStartDate: newStartDate,
    });

    expect(updatedInvite.expectedStartDate).toEqual(newStartDate);
  });

  it('should update expiresAt', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Fernanda Souza',
      email: 'fernanda@example.com',
    });

    const newExpiration = new Date('2026-05-01');

    const { invite: updatedInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
      expiresAt: newExpiration,
    });

    expect(updatedInvite.expiresAt).toEqual(newExpiration);
  });
});
