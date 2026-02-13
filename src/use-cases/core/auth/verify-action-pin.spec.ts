import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it } from 'vitest';
import { SetActionPinUseCase } from './set-action-pin';
import { VerifyActionPinUseCase } from './verify-action-pin';

let usersRepository: InMemoryUsersRepository;
let setActionPinUseCase: SetActionPinUseCase;
let verifyActionPinUseCase: VerifyActionPinUseCase;

describe('Verify Action PIN Use Case', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    setActionPinUseCase = new SetActionPinUseCase(usersRepository);
    verifyActionPinUseCase = new VerifyActionPinUseCase(usersRepository);
  });

  it('should return valid=true for correct PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await setActionPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newActionPin: '1234',
    });

    const result = await verifyActionPinUseCase.execute({
      userId: user.id,
      actionPin: '1234',
    });

    expect(result.valid).toBe(true);
  });

  it('should return valid=false for wrong PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await setActionPinUseCase.execute({
      userId: user.id,
      currentPassword: 'Pass@123',
      newActionPin: '1234',
    });

    const result = await verifyActionPinUseCase.execute({
      userId: user.id,
      actionPin: '5678',
    });

    expect(result.valid).toBe(false);
  });

  it('should throw if user has no action PIN', async () => {
    const { user } = await makeUser({
      email: 'johndoe@example.com',
      password: 'Pass@123',
      usersRepository,
    });

    await expect(
      verifyActionPinUseCase.execute({
        userId: user.id,
        actionPin: '1234',
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw for non-existent user', async () => {
    await expect(
      verifyActionPinUseCase.execute({
        userId: 'non-existent-id',
        actionPin: '1234',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
