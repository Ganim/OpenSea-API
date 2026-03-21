import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { CentralUser } from '@/entities/core/central-user';
import { InMemoryCentralUsersRepository } from '@/repositories/core/in-memory/in-memory-central-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateCentralUserRoleUseCase } from './update-central-user-role';

let centralUsersRepository: InMemoryCentralUsersRepository;
let sut: UpdateCentralUserRoleUseCase;

describe('UpdateCentralUserRoleUseCase', () => {
  beforeEach(() => {
    centralUsersRepository = new InMemoryCentralUsersRepository();
    sut = new UpdateCentralUserRoleUseCase(centralUsersRepository);
  });

  it('should update a central user role', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'owner-1', role: 'OWNER' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'target-user', role: 'VIEWER' }),
    );

    const { centralUser } = await sut.execute({
      userId: 'target-user',
      newRole: 'SUPPORT',
      updatedBy: 'owner-1',
    });

    expect(centralUser.role).toBe('SUPPORT');
  });

  it('should throw ResourceNotFoundError when central user does not exist', async () => {
    await expect(() =>
      sut.execute({
        userId: 'non-existent',
        newRole: 'ADMIN',
        updatedBy: 'owner-1',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError for invalid role', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-1', role: 'VIEWER' }),
    );

    await expect(() =>
      sut.execute({
        userId: 'user-1',
        newRole: 'INVALID',
        updatedBy: 'owner-1',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow OWNER to promote to ADMIN', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'owner-1', role: 'OWNER' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'viewer-1', role: 'VIEWER' }),
    );

    const { centralUser } = await sut.execute({
      userId: 'viewer-1',
      newRole: 'ADMIN',
      updatedBy: 'owner-1',
    });

    expect(centralUser.role).toBe('ADMIN');
  });

  it('should throw ForbiddenError when non-OWNER promotes to OWNER', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'admin-1', role: 'ADMIN' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'viewer-1', role: 'VIEWER' }),
    );

    await expect(() =>
      sut.execute({
        userId: 'viewer-1',
        newRole: 'OWNER',
        updatedBy: 'admin-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw ForbiddenError when non-OWNER promotes to ADMIN', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'support-1', role: 'SUPPORT' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'viewer-1', role: 'VIEWER' }),
    );

    await expect(() =>
      sut.execute({
        userId: 'viewer-1',
        newRole: 'ADMIN',
        updatedBy: 'support-1',
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it('should throw BadRequestError when last OWNER demotes themselves', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'sole-owner', role: 'OWNER' }),
    );

    await expect(() =>
      sut.execute({
        userId: 'sole-owner',
        newRole: 'ADMIN',
        updatedBy: 'sole-owner',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow OWNER to demote themselves when another OWNER exists', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'owner-1', role: 'OWNER' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'owner-2', role: 'OWNER' }),
    );

    const { centralUser } = await sut.execute({
      userId: 'owner-1',
      newRole: 'ADMIN',
      updatedBy: 'owner-1',
    });

    expect(centralUser.role).toBe('ADMIN');
  });

  it('should allow non-elevated role changes without OWNER check', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'admin-1', role: 'ADMIN' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'viewer-1', role: 'VIEWER' }),
    );

    const { centralUser } = await sut.execute({
      userId: 'viewer-1',
      newRole: 'SUPPORT',
      updatedBy: 'admin-1',
    });

    expect(centralUser.role).toBe('SUPPORT');
  });
});
