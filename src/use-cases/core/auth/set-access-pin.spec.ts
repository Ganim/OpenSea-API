import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Pin } from '@/entities/core/value-objects/pin';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { SetAccessPinUseCase } from './set-access-pin';

let usersRepository: InMemoryUsersRepository;
let setAccessPinUseCase: SetAccessPinUseCase;

describe('Set Access PIN Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    setAccessPinUseCase = new SetAccessPinUseCase(usersRepository);
  });

  it('should set access PIN with correct password', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const result = await setAccessPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newAccessPin: '123456',
    });

    expect(result.user).toBeDefined();
    expect(result.user.hasAccessPin).toBe(true);
    expect(result.user.forceAccessPinSetup).toBe(false);
  });

  it('should reject with wrong password', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      setAccessPinUseCase.execute({
        userId: user.id,
        currentPassword: 'WrongPass',
        newAccessPin: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject invalid PIN format (not 6 digits)', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      setAccessPinUseCase.execute({
        userId: user.id,
        currentPassword: 'Pass@123',
        newAccessPin: '1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      setAccessPinUseCase.execute({
        userId: user.id,
        currentPassword: 'Pass@123',
        newAccessPin: 'abcdef',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject for non-existent user', async () => {
    await expect(
      setAccessPinUseCase.execute({
        userId: 'non-existent-id',
        currentPassword: 'Pass@123',
        newAccessPin: '123456',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should allow verifying the set PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await setAccessPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newAccessPin: '654321',
    });

    const updatedUser = await usersRepository.findByEmail(
      (await import('@/entities/core/value-objects/email')).Email.create(
        'johndoe@example.com',
      ),
    );

    expect(updatedUser?.accessPin).toBeDefined();
    const match = await Pin.compare('654321', updatedUser!.accessPin!.value);
    expect(match).toBe(true);
  });
});
