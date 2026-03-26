import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { InMemoryBankConnectionsRepository } from '@/repositories/finance/in-memory/in-memory-bank-connections-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DisconnectBankUseCase } from './disconnect-bank';

let bankConnectionsRepository: InMemoryBankConnectionsRepository;
let sut: DisconnectBankUseCase;

describe('DisconnectBankUseCase', () => {
  beforeEach(() => {
    bankConnectionsRepository = new InMemoryBankConnectionsRepository();
    sut = new DisconnectBankUseCase(bankConnectionsRepository);
  });

  it('should revoke a bank connection', async () => {
    const connection = await bankConnectionsRepository.create({
      tenantId: 'tenant-1',
      bankAccountId: 'account-1',
      externalItemId: 'item-123',
      accessToken: 'token',
    });

    await sut.execute({
      tenantId: 'tenant-1',
      connectionId: connection.id,
    });

    const updated = bankConnectionsRepository.items.find(
      (c) => c.id === connection.id,
    );
    expect(updated?.status).toBe('REVOKED');
  });

  it('should reject when connection not found', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        connectionId: 'non-existent-id',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
