import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Mock Prisma ─────────────────────────────────────────────────────────────

const { mockFindUnique, mockCreate, mockUpsert } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockCreate: vi.fn(),
  mockUpsert: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    esocialConfig: {
      findUnique: mockFindUnique,
      create: mockCreate,
      upsert: mockUpsert,
    },
  },
}));

import {
  GetEsocialConfigUseCase,
  UpdateEsocialConfigUseCase,
} from './manage-esocial-config';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-esocial-config';

function makeConfigRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  return {
    id: 'config-1',
    tenantId: TENANT_ID,
    environment: 'HOMOLOGACAO',
    autoGenerate: false,
    requireApproval: true,
    employerType: 'CNPJ',
    employerDocument: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

// ─── GetEsocialConfigUseCase ─────────────────────────────────────────────────

describe('GetEsocialConfigUseCase', () => {
  let sut: GetEsocialConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new GetEsocialConfigUseCase();
  });

  it('should return existing config for the tenant', async () => {
    const existingConfig = makeConfigRecord();
    mockFindUnique.mockResolvedValue(existingConfig);

    const { config } = await sut.execute({ tenantId: TENANT_ID });

    expect(config.id).toBe('config-1');
    expect(config.environment).toBe('HOMOLOGACAO');
    expect(config.autoGenerate).toBe(false);
    expect(config.requireApproval).toBe(true);
    expect(config.employerType).toBe('CNPJ');
    expect(config.employerDocument).toBeNull();

    expect(mockFindUnique).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('should create default config when none exists', async () => {
    const defaultConfig = makeConfigRecord();
    mockFindUnique.mockResolvedValue(null);
    mockCreate.mockResolvedValue(defaultConfig);

    const { config } = await sut.execute({ tenantId: TENANT_ID });

    expect(config.id).toBe('config-1');
    expect(config.environment).toBe('HOMOLOGACAO');

    expect(mockCreate).toHaveBeenCalledWith({
      data: { tenantId: TENANT_ID },
    });
  });

  it('should return ISO date strings for createdAt and updatedAt', async () => {
    const fixedDate = new Date('2026-01-15T10:00:00.000Z');
    const existingConfig = makeConfigRecord({
      createdAt: fixedDate,
      updatedAt: fixedDate,
    });
    mockFindUnique.mockResolvedValue(existingConfig);

    const { config } = await sut.execute({ tenantId: TENANT_ID });

    expect(config.createdAt).toBe('2026-01-15T10:00:00.000Z');
    expect(config.updatedAt).toBe('2026-01-15T10:00:00.000Z');
  });
});

// ─── UpdateEsocialConfigUseCase ──────────────────────────────────────────────

describe('UpdateEsocialConfigUseCase', () => {
  let sut: UpdateEsocialConfigUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new UpdateEsocialConfigUseCase();
  });

  it('should update environment to PRODUCAO', async () => {
    const updatedConfig = makeConfigRecord({ environment: 'PRODUCAO' });
    mockUpsert.mockResolvedValue(updatedConfig);

    const { config } = await sut.execute({
      tenantId: TENANT_ID,
      environment: 'PRODUCAO',
    });

    expect(config.environment).toBe('PRODUCAO');
    expect(mockUpsert).toHaveBeenCalledWith({
      where: { tenantId: TENANT_ID },
      create: { tenantId: TENANT_ID, environment: 'PRODUCAO' },
      update: { environment: 'PRODUCAO' },
    });
  });

  it('should update autoGenerate and requireApproval flags', async () => {
    const updatedConfig = makeConfigRecord({
      autoGenerate: true,
      requireApproval: false,
    });
    mockUpsert.mockResolvedValue(updatedConfig);

    const { config } = await sut.execute({
      tenantId: TENANT_ID,
      autoGenerate: true,
      requireApproval: false,
    });

    expect(config.autoGenerate).toBe(true);
    expect(config.requireApproval).toBe(false);
  });

  it('should update employer document', async () => {
    const updatedConfig = makeConfigRecord({
      employerDocument: '12.345.678/0001-99',
    });
    mockUpsert.mockResolvedValue(updatedConfig);

    const { config } = await sut.execute({
      tenantId: TENANT_ID,
      employerDocument: '12.345.678/0001-99',
    });

    expect(config.employerDocument).toBe('12.345.678/0001-99');
  });

  it('should create config via upsert when it does not exist', async () => {
    const newConfig = makeConfigRecord({
      environment: 'PRODUCAO',
      employerType: 'CPF',
    });
    mockUpsert.mockResolvedValue(newConfig);

    await sut.execute({
      tenantId: TENANT_ID,
      environment: 'PRODUCAO',
      employerType: 'CPF',
    });

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({
          tenantId: TENANT_ID,
          environment: 'PRODUCAO',
          employerType: 'CPF',
        }),
      }),
    );
  });
});
