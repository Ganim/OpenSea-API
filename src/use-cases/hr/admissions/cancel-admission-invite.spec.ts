import { InMemoryAdmissionsRepository } from '@/repositories/hr/in-memory/in-memory-admissions-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CancelAdmissionInviteUseCase } from './cancel-admission-invite';

let admissionsRepository: InMemoryAdmissionsRepository;
let sut: CancelAdmissionInviteUseCase;
const tenantId = 'tenant-123';

describe('Cancel Admission Invite Use Case', () => {
  beforeEach(() => {
    admissionsRepository = new InMemoryAdmissionsRepository();
    sut = new CancelAdmissionInviteUseCase(admissionsRepository);
  });

  it('should cancel a pending admission invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Maria Santos',
      email: 'maria@example.com',
    });

    const { invite: cancelledInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
    });

    expect(cancelledInvite.status).toBe('CANCELLED');
  });

  it('should cancel an in-progress admission invite', async () => {
    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'João Silva',
      email: 'joao@example.com',
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'IN_PROGRESS',
    });

    const { invite: cancelledInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
    });

    expect(cancelledInvite.status).toBe('CANCELLED');
  });

  it('should throw if invite is not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        inviteId: 'non-existent-id',
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
      }),
    ).rejects.toThrow('Cannot cancel a completed admission');
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
      }),
    ).rejects.toThrow('Admission is already cancelled');
  });

  it('should cancel an expired invite', async () => {
    const expiredDate = new Date();
    expiredDate.setDate(expiredDate.getDate() - 1);

    const invite = await admissionsRepository.create({
      tenantId,
      fullName: 'Carlos Lima',
      email: 'carlos@example.com',
      expiresAt: expiredDate,
    });

    await admissionsRepository.update({
      id: invite.id,
      status: 'EXPIRED',
    });

    const { invite: cancelledInvite } = await sut.execute({
      tenantId,
      inviteId: invite.id,
    });

    expect(cancelledInvite.status).toBe('CANCELLED');
  });
});
