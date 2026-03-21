import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { CentralUser } from '@/entities/core/central-user';
import { InMemoryCentralUsersRepository } from '@/repositories/core/in-memory/in-memory-central-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RemoveCentralUserUseCase } from './remove-central-user';

let centralUsersRepository: InMemoryCentralUsersRepository;
let sut: RemoveCentralUserUseCase;

describe('RemoveCentralUserUseCase', () => {
  beforeEach(() => {
    centralUsersRepository = new InMemoryCentralUsersRepository();
    sut = new RemoveCentralUserUseCase(centralUsersRepository);
  });

  it('should remove a central user', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-to-remove', role: 'VIEWER' }),
    );

    const { success } = await sut.execute({ userId: 'user-to-remove' });

    expect(success).toBe(true);
    expect(centralUsersRepository.items).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when central user does not exist', async () => {
    await expect(() =>
      sut.execute({ userId: 'non-existent' }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError when trying to remove the last OWNER', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'sole-owner', role: 'OWNER' }),
    );

    await expect(() =>
      sut.execute({ userId: 'sole-owner' }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should allow removing an OWNER when another OWNER exists', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'owner-1', role: 'OWNER' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'owner-2', role: 'OWNER' }),
    );

    const { success } = await sut.execute({ userId: 'owner-1' });

    expect(success).toBe(true);
    expect(centralUsersRepository.items).toHaveLength(1);
    expect(centralUsersRepository.items[0].userId).toBe('owner-2');
  });

  it('should allow removing non-OWNER roles freely', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'admin-1', role: 'ADMIN' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'support-1', role: 'SUPPORT' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'finance-1', role: 'FINANCE' }),
    );

    await sut.execute({ userId: 'admin-1' });
    await sut.execute({ userId: 'support-1' });

    expect(centralUsersRepository.items).toHaveLength(1);
    expect(centralUsersRepository.items[0].userId).toBe('finance-1');
  });
});
