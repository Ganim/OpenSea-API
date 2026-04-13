vi.mock('@/lib/prisma', () => ({
  prisma: {
    tenantUser: {
      findFirst: vi.fn(),
    },
  },
}));

vi.mock('bcryptjs', () => ({
  compare: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { compare } from 'bcryptjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VerifySecurityKeyUseCase } from './verify-security-key';

const tenantId = 'tenant-1';
const userId = 'user-1';

describe('VerifySecurityKeyUseCase', () => {
  let sut: VerifySecurityKeyUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new VerifySecurityKeyUseCase();
  });

  it('should return valid: true when key matches hash', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue({
      id: 'tu-1',
      tenantId,
      userId,
      securityKeyHash: '$2a$10$hashedkey',
    } as any);
    vi.mocked(compare).mockResolvedValue(true as any);

    const result = await sut.execute({
      tenantId,
      userId,
      key: '1234',
    });

    expect(result.valid).toBe(true);
    expect(compare).toHaveBeenCalledWith('1234', '$2a$10$hashedkey');
  });

  it('should return valid: false when key does not match', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue({
      id: 'tu-1',
      tenantId,
      userId,
      securityKeyHash: '$2a$10$hashedkey',
    } as any);
    vi.mocked(compare).mockResolvedValue(false as any);

    const result = await sut.execute({
      tenantId,
      userId,
      key: 'wrong',
    });

    expect(result.valid).toBe(false);
  });

  it('should return valid: false when tenantUser not found', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue(null);

    const result = await sut.execute({
      tenantId,
      userId,
      key: '1234',
    });

    expect(result.valid).toBe(false);
    expect(compare).not.toHaveBeenCalled();
  });

  it('should return valid: false when securityKeyHash is null', async () => {
    vi.mocked(prisma.tenantUser.findFirst).mockResolvedValue({
      id: 'tu-1',
      tenantId,
      userId,
      securityKeyHash: null,
    } as any);

    const result = await sut.execute({
      tenantId,
      userId,
      key: '1234',
    });

    expect(result.valid).toBe(false);
    expect(compare).not.toHaveBeenCalled();
  });
});
