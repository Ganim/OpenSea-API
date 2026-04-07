import type { IFocusNfeProvider } from '@/providers/nfe/focus-nfe.provider';
import { InMemoryFocusNfeConfigRepository } from '@/repositories/sales/in-memory/in-memory-focus-nfe-config-repository';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ConfigureFocusNfeUseCase } from './configure-focus-nfe.use-case';

describe('ConfigureFocusNfeUseCase', () => {
  let focusNfeConfigRepository: InMemoryFocusNfeConfigRepository;
  let focusNfeProvider: IFocusNfeProvider;
  let useCase: ConfigureFocusNfeUseCase;

  const tenantId = 'tenant-123';
  const userId = 'user-123';

  beforeEach(() => {
    focusNfeConfigRepository = new InMemoryFocusNfeConfigRepository();
    focusNfeProvider = {
      testConnection: vi.fn(async () => ({ ok: true, message: 'ok' })),
      createInvoice: vi.fn(),
      checkStatus: vi.fn(),
      cancelInvoice: vi.fn(),
    };
    useCase = new ConfigureFocusNfeUseCase(
      focusNfeConfigRepository,
      focusNfeProvider,
    );
  });

  it('should create new config if not exists', async () => {
    const result = await useCase.execute({
      tenantId,
      apiKey: 'test-api-key',
      productionMode: false,
      userId,
    });

    expect(result.configured).toBe(true);
    expect(result.productionMode).toBe(false);
    expect(result.isEnabled).toBe(true);
  });

  it('should update existing config', async () => {
    // Create first
    await useCase.execute({
      tenantId,
      apiKey: 'test-api-key-1',
      productionMode: false,
      userId,
    });

    // Update
    const result = await useCase.execute({
      tenantId,
      apiKey: 'test-api-key-2',
      productionMode: true,
      userId,
    });

    expect(result.configured).toBe(true);
    expect(result.productionMode).toBe(true);

    // Verify in repository
    const config = await focusNfeConfigRepository.findByTenant(tenantId);
    expect(config?.apiKey).toBe('test-api-key-2');
  });
});
