import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryBankConnectionsRepository } from '@/repositories/finance/in-memory/in-memory-bank-connections-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListBankConnectionsUseCase } from './list-bank-connections';

// P2-62: the only finance use case shipping without a unit spec. Covers
// the happy path (returns only the tenant's connections), tenant
// isolation (never leak across tenants) and the empty state.

let bankConnectionsRepository: InMemoryBankConnectionsRepository;
let sut: ListBankConnectionsUseCase;

describe('ListBankConnectionsUseCase', () => {
  beforeEach(() => {
    bankConnectionsRepository = new InMemoryBankConnectionsRepository();
    sut = new ListBankConnectionsUseCase(bankConnectionsRepository);
  });

  it('should return an empty list when the tenant has no connections', async () => {
    const result = await sut.execute({ tenantId: 'tenant-empty' });

    expect(result.connections).toEqual([]);
  });

  it('should return only the connections that belong to the tenant', async () => {
    await bankConnectionsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-a',
      externalItemId: 'item-a',
      accessToken: 'token-a',
    });

    await bankConnectionsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-b',
      externalItemId: 'item-b',
      accessToken: 'token-b',
    });

    // Another tenant's connection — must not leak
    await bankConnectionsRepository.create({
      tenantId: 'tenant-2',
      bankAccountId: 'bank-account-c',
      externalItemId: 'item-c',
      accessToken: 'token-c',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.connections).toHaveLength(2);
    expect(result.connections.every((c) => c.tenantId === 'tenant-1')).toBe(
      true,
    );
    const externalIds = result.connections.map((c) => c.externalItemId);
    expect(externalIds).toEqual(expect.arrayContaining(['item-a', 'item-b']));
    expect(externalIds).not.toContain('item-c');
  });

  it('should surface revoked connections (status is not filtered here)', async () => {
    // The repository itself exposes all statuses via findMany — the
    // "hide revoked" concern belongs to the caller / UI filter. This
    // test locks that contract so a future repo-side filter change
    // trips the spec.
    const active = await bankConnectionsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'bank-account-a',
      externalItemId: 'item-a',
      accessToken: 'token-a',
    });

    await bankConnectionsRepository.update({
      id: new UniqueEntityID(active.id),
      tenantId: 'tenant-1',
      status: 'REVOKED',
    });

    const result = await sut.execute({ tenantId: 'tenant-1' });

    expect(result.connections).toHaveLength(1);
    expect(result.connections[0].status).toBe('REVOKED');
  });
});
