import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FocusNfeConfig } from '@/entities/sales/focus-nfe-config';
import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import { InMemoryFocusNfeConfigRepository } from '@/repositories/sales/in-memory/in-memory-focus-nfe-config-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigureFocusNfeUseCase } from './configure-focus-nfe.use-case';

describe('ConfigureFocusNfeUseCase', () => {
  let focusNfeConfigRepository: InMemoryFocusNfeConfigRepository;
  let focusNfeProvider: IFocusNfeProvider;
  let sut: ConfigureFocusNfeUseCase;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeEach(() => {
    focusNfeConfigRepository = new InMemoryFocusNfeConfigRepository();
    focusNfeProvider = {
      testConnection: vi.fn().mockResolvedValue({ ok: true, message: 'ok' }),
      createInvoice: vi.fn(),
      checkStatus: vi.fn(),
      cancelInvoice: vi.fn(),
    };
    sut = new ConfigureFocusNfeUseCase(
      focusNfeConfigRepository,
      focusNfeProvider,
    );
  });

  it('should create new config if not exists', async () => {
    const result = await sut.execute({
      tenantId,
      apiKey: 'test-api-key',
      productionMode: false,
      userId,
    });

    expect(result.configured).toBe(true);
    expect(result.productionMode).toBe(false);
    expect(result.isEnabled).toBe(true);
    expect(focusNfeConfigRepository.items).toHaveLength(1);
  });

  it('should update existing config', async () => {
    const existing = FocusNfeConfig.create({
      tenantId: new UniqueEntityID(tenantId),
      apiKey: 'old-key',
      productionMode: false,
      isEnabled: false,
      autoIssueOnConfirm: false,
      defaultSeries: '1',
      createdBy: userId,
    });
    focusNfeConfigRepository.items.push(existing);

    const result = await sut.execute({
      tenantId,
      apiKey: 'new-api-key',
      productionMode: true,
      autoIssueOnConfirm: true,
      defaultSeries: '2',
      userId,
    });

    expect(result.configured).toBe(true);
    expect(result.productionMode).toBe(true);
    expect(focusNfeConfigRepository.items).toHaveLength(1);
    expect(focusNfeConfigRepository.items[0].apiKey).toBe('new-api-key');
    expect(focusNfeConfigRepository.items[0].defaultSeries).toBe('2');
  });

  it('should throw error if connection test fails', async () => {
    vi.mocked(focusNfeProvider.testConnection).mockResolvedValueOnce({
      ok: false,
      message: 'Invalid API key',
    });

    await expect(
      sut.execute({
        tenantId,
        apiKey: 'bad-key',
        productionMode: false,
        userId,
      }),
    ).rejects.toThrow('Failed to connect to Focus NFe');
  });
});
