vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenantUser: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashed-key'),
}));

import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SetUserSecurityKeyUseCase } from './set-user-security-key';

let sut: SetUserSecurityKeyUseCase;

describe('SetUserSecurityKeyUseCase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sut = new SetUserSecurityKeyUseCase();
  });

  it('should set security key for an existing tenant user', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue({
      id: 'tu-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
    } as never);

    vi.mocked(prisma.tenantUser.update).mockResolvedValue({} as never);

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      securityKey: '1234',
    });

    expect(prisma.tenantUser.findFirst).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        userId: 'user-1',
        deletedAt: null,
      },
    });

    expect(hash).toHaveBeenCalledWith('1234', 10);

    expect(prisma.tenantUser.update).toHaveBeenCalledWith({
      where: { id: 'tu-1' },
      data: { securityKeyHash: 'hashed-key' },
    });
  });

  it('should remove security key when null is provided', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue({
      id: 'tu-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
    } as never);

    vi.mocked(prisma.tenantUser.update).mockResolvedValue({} as never);

    await sut.execute({
      tenantId: 'tenant-1',
      userId: 'user-1',
      securityKey: null,
    });

    expect(hash).not.toHaveBeenCalled();

    expect(prisma.tenantUser.update).toHaveBeenCalledWith({
      where: { id: 'tu-1' },
      data: { securityKeyHash: null },
    });
  });

  it('should throw ResourceNotFoundError when tenant user does not exist', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue(null);

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        userId: 'user-1',
        securityKey: '1234',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
