import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { InMemoryAccountantAccessesRepository } from '@/repositories/finance/in-memory/in-memory-accountant-accesses-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { InviteAccountantUseCase } from './invite-accountant';

let repository: InMemoryAccountantAccessesRepository;
let sut: InviteAccountantUseCase;

describe('InviteAccountantUseCase', () => {
  beforeEach(() => {
    repository = new InMemoryAccountantAccessesRepository();
    sut = new InviteAccountantUseCase(repository);
  });

  it('should create an accountant access with a unique token', async () => {
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
    expect(result.access.accessToken).toMatch(/^acc_/);
    expect(result.access.isActive).toBe(true);
    expect(result.portalUrl).toContain('/accountant/');
    expect(repository.items).toHaveLength(1);
  });

  it('should set expiration when expiresInDays is provided', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      email: 'contador@teste.com',
      name: 'João Contador',
      expiresInDays: 90,
    });

    expect(result.access.expiresAt).toBeDefined();
    const expectedDate = new Date();
    expectedDate.setDate(expectedDate.getDate() + 90);
    // Allow 5s tolerance
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
});
