import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GetEnvelopeByIdUseCase } from './get-envelope-by-id';

const tenantId = 'tenant-1';
const envelopeId = 'envelope-1';

function makeMocks() {
  const envelopesRepository = {
    findByIdWithRelations: vi.fn(),
  } as unknown;

  const sut = new GetEnvelopeByIdUseCase(envelopesRepository);

  return { sut, envelopesRepository };
}

describe('GetEnvelopeByIdUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should return an envelope when it exists', async () => {
    const envelope = {
      id: new UniqueEntityID(envelopeId),
      title: 'Contract',
      status: 'PENDING',
    };

    mocks.envelopesRepository.findByIdWithRelations.mockResolvedValue(envelope);

    const result = await mocks.sut.execute({ tenantId, envelopeId });

    expect(result.envelope).toEqual(envelope);
    expect(
      mocks.envelopesRepository.findByIdWithRelations,
    ).toHaveBeenCalledWith(expect.any(UniqueEntityID), tenantId);
  });

  it('should throw ResourceNotFoundError when envelope does not exist', async () => {
    mocks.envelopesRepository.findByIdWithRelations.mockResolvedValue(null);

    await expect(
      mocks.sut.execute({ tenantId, envelopeId }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
