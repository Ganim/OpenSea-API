import { CentralUser } from '@/entities/core/central-user';
import { InMemoryCentralUsersRepository } from '@/repositories/core/in-memory/in-memory-central-users-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCentralUsersUseCase } from './list-central-users';

let centralUsersRepository: InMemoryCentralUsersRepository;
let sut: ListCentralUsersUseCase;

describe('ListCentralUsersUseCase', () => {
  beforeEach(() => {
    centralUsersRepository = new InMemoryCentralUsersRepository();
    sut = new ListCentralUsersUseCase(centralUsersRepository);
  });

  it('should list all central users', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-1', role: 'OWNER' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-2', role: 'ADMIN' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-3', role: 'VIEWER' }),
    );

    const { users } = await sut.execute({});

    expect(users).toHaveLength(3);
  });

  it('should filter central users by role', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-1', role: 'OWNER' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-2', role: 'ADMIN' }),
    );
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-3', role: 'OWNER' }),
    );

    const { users } = await sut.execute({ role: 'OWNER' });

    expect(users).toHaveLength(2);
    expect(users.every((u) => u.role === 'OWNER')).toBe(true);
  });

  it('should return empty array when no central users exist', async () => {
    const { users } = await sut.execute({});

    expect(users).toHaveLength(0);
    expect(users).toEqual([]);
  });

  it('should return empty array when no users match the role filter', async () => {
    await centralUsersRepository.create(
      CentralUser.create({ userId: 'user-1', role: 'OWNER' }),
    );

    const { users } = await sut.execute({ role: 'FINANCE' });

    expect(users).toHaveLength(0);
  });
});
