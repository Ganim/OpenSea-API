import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListSignatureTemplatesUseCase } from './list-templates';

const tenantId = 'tenant-1';

function makeMocks() {
  const templatesRepository = {
    findMany: vi.fn(),
  } as unknown;

  const sut = new ListSignatureTemplatesUseCase(templatesRepository);

  return { sut, templatesRepository };
}

describe('ListSignatureTemplatesUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should list templates with default pagination', async () => {
    const templates = [
      { id: new UniqueEntityID(), name: 'Template 1' },
      { id: new UniqueEntityID(), name: 'Template 2' },
    ];

    mocks.templatesRepository.findMany.mockResolvedValue({
      templates,
      total: 2,
    });

    const result = await mocks.sut.execute({ tenantId });

    expect(result.templates).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.pages).toBe(1);
  });

  it('should apply filters', async () => {
    mocks.templatesRepository.findMany.mockResolvedValue({
      templates: [],
      total: 0,
    });

    await mocks.sut.execute({
      tenantId,
      isActive: true,
      search: 'contract',
      page: 3,
      limit: 5,
    });

    expect(mocks.templatesRepository.findMany).toHaveBeenCalledWith({
      tenantId,
      isActive: true,
      search: 'contract',
      page: 3,
      limit: 5,
    });
  });

  it('should cap limit at 100', async () => {
    mocks.templatesRepository.findMany.mockResolvedValue({
      templates: [],
      total: 0,
    });

    const result = await mocks.sut.execute({ tenantId, limit: 999 });

    expect(result.limit).toBe(100);
  });

  it('should calculate pages correctly', async () => {
    mocks.templatesRepository.findMany.mockResolvedValue({
      templates: [],
      total: 42,
    });

    const result = await mocks.sut.execute({ tenantId, limit: 10 });

    expect(result.pages).toBe(5);
  });

  it('should return empty list when no templates exist', async () => {
    mocks.templatesRepository.findMany.mockResolvedValue({
      templates: [],
      total: 0,
    });

    const result = await mocks.sut.execute({ tenantId });

    expect(result.templates).toHaveLength(0);
    expect(result.pages).toBe(0);
  });
});
