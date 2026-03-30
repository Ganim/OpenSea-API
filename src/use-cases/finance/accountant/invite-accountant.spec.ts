import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { InMemoryAccountantAccessesRepository } from '@/repositories/finance/in-memory/in-memory-accountant-accesses-repository';
import { hashToken } from '@/utils/security/hash-token';
import { beforeEach, describe, expect, it } from 'vitest';
import { InviteAccountantUseCase } from './invite-accountant';

let repository: InMemoryAccountantAccessesRepository;
let sut: InviteAccountantUseCase;

describe('InviteAccountantUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryAccountantAccessesRepository();
    sut = new InviteAccountantUseCase(repository);
  });

  it('should create an accountant access with a hashed token', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      cpfCnpj: '12345678901',
      crc: 'CRC-SP-123456',
    });

    expect(result.access).toBeDefined();
    expect(result.access.email).toBe('contador@teste.com');
    expect(result.access.name).toBe('João Contador');
    expect(result.access.isActive).toBe(true);
    expect(result.portalUrl).toContain('/accountant/');
    expect(repository.items).toHaveLength(1);

    // rawToken starts with acc_ prefix and uses crypto.randomBytes (64 hex chars)
    expect(result.rawToken).toMatch(/^acc_[0-9a-f]{64}$/);

    // DB stores the SHA-256 hash, NOT the raw token
    const storedToken = repository.items[0].accessToken;
    expect(storedToken).not.toBe(result.rawToken);
    expect(storedToken).toBe(hashToken(result.rawToken));

    // portalUrl uses the raw token (not the hash)
    expect(result.portalUrl).toBe(`/accountant/${result.rawToken}`);
  });

  it('should set default expiration of 90 days when expiresInDays is omitted', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
    });

    expect(result.access.expiresAt).toBeDefined();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 90);
    const diff = Math.abs(
      result.access.expiresAt!.getTime() - expectedDate.getTime(),
    );
    expect(diff).toBeLessThan(5000);
  });

  it('should set expiration when expiresInDays is provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      expiresInDays: 30,
    });

    expect(result.access.expiresAt).toBeDefined();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 30);
    const diff = Math.abs(
      result.access.expiresAt!.getTime() - expectedDate.getTime(),
    );
    expect(diff).toBeLessThan(5000);
  });

  it('should reject duplicate active email for same tenant', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        email: 'contador@teste.com',
        name: 'Outro Contador',
      }),
    ).rejects.toBeInstanceOf(ConflictError);
  });

  it('should allow same email for different tenants', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
    });

    const result = await sut.execute({
      tenantId: 'tenant-2',
      email: 'contador@teste.com',
      name: 'João Contador',
    });

    expect(result.access).toBeDefined();
    expect(repository.items).toHaveLength(2);
  });

  it('should produce deterministic hashes (same input = same output)', () => {
    const token = 'acc_test123';
    expect(hashToken(token)).toBe(hashToken(token));
  });
});
