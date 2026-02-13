import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { Pin } from '@/entities/core/value-objects/pin';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { SetActionPinUseCase } from './set-action-pin';

let usersRepository: InMemoryUsersRepository;
let setActionPinUseCase: SetActionPinUseCase;

describe('Set Action PIN Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    setActionPinUseCase = new SetActionPinUseCase(usersRepository);
  });

  it('should set action PIN with correct password', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    const result = await setActionPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newActionPin: '1234',
    });

    expect(result.user).toBeDefined();
    expect(result.user.hasActionPin).toBe(true);
    expect(result.user.forceActionPinSetup).toBe(false);
  });

  it('should reject with wrong password', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      setActionPinUseCase.execute({
        userId: user.id,
        currentPassword: 'WrongPass',
        newActionPin: '1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject invalid PIN format (not 4 digits)', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      setActionPinUseCase.execute({
        userId: user.id,
        currentPassword: 'Pass@123',
        newActionPin: '123456',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);

    await expect(
      setActionPinUseCase.execute({
        userId: user.id,
        currentPassword: 'Pass@123',
        newActionPin: 'abcd',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should reject for non-existent user', async () => {
    await expect(
      setActionPinUseCase.execute({
        userId: 'non-existent-id',
        currentPassword: 'Pass@123',
        newActionPin: '1234',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should allow verifying the set PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await setActionPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newActionPin: '5678',
    });

    const updatedUser = await usersRepository.findByEmail(
      (await import('@/entities/core/value-objects/email')).Email.create(
        'johndoe@example.com',
      ),
    );

    expect(updatedUser?.actionPin).toBeDefined();
    const match = await Pin.compare('5678', updatedUser!.actionPin!.value);
    expect(match).toBe(true);
  });
});
