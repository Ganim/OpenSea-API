import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryUsersRepository } from '@/repositories/core/in-memory/in-memory-users-repository';
import { makeUser } from '@/utils/tests/factories/core/make-user';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ForcePasswordResetUseCase } from './force-password-reset';

const mockEmailService = {
  sendNotificationEmail: vi.fn().mockResolvedValue({ success: true }),
  sendPasswordResetEmail: vi.fn().mockResolvedValue({ success: true }),
};

let usersRepository: InMemoryUsersRepository;
let sut: ForcePasswordResetUseCase;

describe('ForcePasswordResetUseCase', () => {
  beforeEach(() => {
    usersRepository = new InMemoryUsersRepository();
    sut = new ForcePasswordResetUseCase(
      usersRepository,
      mockEmailService as never,
    );
    vi.clearAllMocks();
  });

  it('should set forced password reset for user', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      reason: 'Security compliance',
      sendEmail: false,
    });

    expect(result.user.forcePasswordReset).toBe(true);
    expect(result.user.forcePasswordResetReason).toBe('Security compliance');
    expect(result.message).toContain('successfully');
  });

  it('should set forced password reset without reason', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      sendEmail: false,
    });

    expect(result.user.forcePasswordReset).toBe(true);
    expect(result.user.forcePasswordResetReason).toBeNull();
  });

  it('should send email when requested', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    const result = await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      reason: 'Policy update',
      sendEmail: true,
    });

    expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledOnce();
    expect(mockEmailService.sendNotificationEmail).toHaveBeenCalledWith(
      'target@example.com',
      'Redefinição de Senha Obrigatória',
      expect.stringContaining('Policy update'),
    );
    expect(result.message).toContain('email sent');
  });

  it('should not send email when not requested', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      sendEmail: false,
    });

    expect(mockEmailService.sendNotificationEmail).not.toHaveBeenCalled();
  });

  it('should store requestedBy user id', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      sendEmail: false,
    });

    const updatedUser = await usersRepository.findById(
      new UniqueEntityID(target.id),
    );
    expect(updatedUser?.forcePasswordResetRequestedBy).toBe(admin.id);
    expect(updatedUser?.forcePasswordResetRequestedAt).toBeInstanceOf(Date);
  });

  it('should throw ResourceNotFoundError if target user not found', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    await expect(() =>
      sut.execute({
        targetUserId: 'non-existent-id',
        requestedByUserId: admin.id,
        sendEmail: false,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should throw BadRequestError if requester not found', async () => {
    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    await expect(() =>
      sut.execute({
        targetUserId: target.id,
        requestedByUserId: 'non-existent-admin',
        sendEmail: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw BadRequestError if user already has pending reset', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    // First request - should succeed
    await sut.execute({
      targetUserId: target.id,
      requestedByUserId: admin.id,
      sendEmail: false,
    });

    // Second request - should fail
    await expect(() =>
      sut.execute({
        targetUserId: target.id,
        requestedByUserId: admin.id,
        sendEmail: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestError);
  });

  it('should throw ResourceNotFoundError for deleted user', async () => {
    const { user: admin } = await makeUser({
      email: 'admin@example.com',
      password: 'Admin@123',
      usersRepository,
    });

    const { user: target } = await makeUser({
      email: 'target@example.com',
      password: 'Target@123',
      usersRepository,
    });

    // Soft delete the target user
    const targetUser = await usersRepository.findById(
      new UniqueEntityID(target.id),
    );
    if (targetUser) targetUser.deletedAt = new Date();

    await expect(() =>
      sut.execute({
        targetUserId: target.id,
        requestedByUserId: admin.id,
        sendEmail: false,
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
