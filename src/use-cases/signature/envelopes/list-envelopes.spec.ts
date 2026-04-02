import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ListEnvelopesUseCase } from './list-envelopes';

const tenantId = 'tenant-1';

function makeMocks() {
  const envelopesRepository = {
    findMany: vi.fn(),
  } as unknown;

  const sut = new ListEnvelopesUseCase(envelopesRepository);

  return { sut, envelopesRepository };
}

describe('ListEnvelopesUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should list envelopes with default pagination', async () => {
    const envelopes = [
      { id: new UniqueEntityID(), title: 'Envelope 1' },
      { id: new UniqueEntityID(), title: 'Envelope 2' },
    ];

    mocks.envelopesRepository.findMany.mockResolvedValue({
      envelopes,
      total: 2,
    });

    const result = await mocks.sut.execute({ tenantId });

    expect(result.envelopes).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
    expect(result.pages).toBe(1);
  });

  it('should apply filters to the query', async () => {
    mocks.envelopesRepository.findMany.mockResolvedValue({
      envelopes: [],
      total: 0,
    });

    await mocks.sut.execute({
      tenantId,
      status: 'PENDING',
      sourceModule: 'HR',
      createdByUserId: 'user-1',
      search: 'contract',
      page: 2,
      limit: 10,
    });

    expect(mocks.envelopesRepository.findMany).toHaveBeenCalledWith({
      tenantId,
      status: 'PENDING',
      sourceModule: 'HR',
      createdByUserId: 'user-1',
      search: 'contract',
      page: 2,
      limit: 10,
    });
  });

  it('should cap limit at 100', async () => {
    mocks.envelopesRepository.findMany.mockResolvedValue({
      envelopes: [],
      total: 0,
    });

    const result = await mocks.sut.execute({ tenantId, limit: 500 });

    expect(result.limit).toBe(100);
    expect(mocks.envelopesRepository.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ limit: 100 }),
    );
  });

  it('should calculate pages correctly', async () => {
    mocks.envelopesRepository.findMany.mockResolvedValue({
      envelopes: [],
      total: 55,
    });

    const result = await mocks.sut.execute({ tenantId, limit: 10 });

    expect(result.pages).toBe(6);
  });
});
