import { TenantIntegrationStatus } from '@/entities/core/tenant-integration-status';
import { InMemoryTenantIntegrationStatusRepository } from '@/repositories/core/in-memory/in-memory-tenant-integration-status-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetIntegrationStatusUseCase } from './get-integration-status';

let integrationStatusRepository: InMemoryTenantIntegrationStatusRepository;
let sut: GetIntegrationStatusUseCase;

describe('GetIntegrationStatusUseCase', () => {
  beforeEach(() => {
    integrationStatusRepository =
      new InMemoryTenantIntegrationStatusRepository();
    sut = new GetIntegrationStatusUseCase(integrationStatusRepository);
  });

  it('should return empty counts when no integrations exist', async () => {
    const result = await sut.execute();

    expect(result.totalIntegrations).toBe(0);
    expect(result.countByStatus.CONNECTED).toBe(0);
    expect(result.countByStatus.ERROR).toBe(0);
    expect(result.byType).toHaveLength(0);
    expect(result.tenantsWithErrors).toHaveLength(0);
  });

  it('should count integrations by status', async () => {
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-1',
        integrationType: 'EMAIL',
        status: 'CONNECTED',
      }),
    );
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-2',
        integrationType: 'EMAIL',
        status: 'ERROR',
        errorMessage: 'Connection timeout',
      }),
    );
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-3',
        integrationType: 'STORAGE',
        status: 'CONNECTED',
      }),
    );

    const result = await sut.execute();

    expect(result.totalIntegrations).toBe(3);
    expect(result.countByStatus.CONNECTED).toBe(2);
    expect(result.countByStatus.ERROR).toBe(1);
    expect(result.countByStatus.DISCONNECTED).toBe(0);
  });

  it('should group integrations by type', async () => {
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-1',
        integrationType: 'EMAIL',
        status: 'CONNECTED',
      }),
    );
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-2',
        integrationType: 'EMAIL',
        status: 'DISCONNECTED',
      }),
    );
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-1',
        integrationType: 'STORAGE',
        status: 'CONNECTED',
      }),
    );

    const result = await sut.execute();

    expect(result.byType).toHaveLength(2);
    const emailType = result.byType.find((t) => t.integrationType === 'EMAIL');
    expect(emailType?.total).toBe(2);
    expect(emailType?.byStatus.CONNECTED).toBe(1);
    expect(emailType?.byStatus.DISCONNECTED).toBe(1);
  });

  it('should list tenants with errors', async () => {
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-1',
        integrationType: 'EMAIL',
        status: 'CONNECTED',
      }),
    );
    await integrationStatusRepository.upsert(
      TenantIntegrationStatus.create({
        tenantId: 'tenant-2',
        integrationType: 'EMAIL',
        status: 'ERROR',
        errorMessage: 'IMAP connection refused',
      }),
    );

    const result = await sut.execute();

    expect(result.tenantsWithErrors).toHaveLength(1);
    expect(result.tenantsWithErrors[0].tenantId).toBe('tenant-2');
    expect(result.tenantsWithErrors[0].errorMessage).toBe(
      'IMAP connection refused',
    );
  });
});
