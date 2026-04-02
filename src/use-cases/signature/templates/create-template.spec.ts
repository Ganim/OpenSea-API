import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateSignatureTemplateUseCase } from './create-template';

const tenantId = 'tenant-1';

function makeMocks() {
  const templatesRepository = {
    create: vi.fn(),
  } as unknown;

  const sut = new CreateSignatureTemplateUseCase(templatesRepository);

  return { sut, templatesRepository };
}

describe('CreateSignatureTemplateUseCase', () => {
  let mocks: ReturnType<typeof makeMocks>;

  beforeEach(() => {
    mocks = makeMocks();
  });

  it('should create a signature template', async () => {
    const template = {
      id: new UniqueEntityID(),
      tenantId,
      name: 'Standard Contract',
      signatureLevel: 'ADVANCED',
      routingType: 'SEQUENTIAL',
      signerSlots: [{ role: 'SIGNER', order: 1 }],
    };

    mocks.templatesRepository.create.mockResolvedValue(template);

    const result = await mocks.sut.execute({
      tenantId,
      name: 'Standard Contract',
      description: 'Template for standard contracts',
      signatureLevel: 'ADVANCED',
      routingType: 'SEQUENTIAL',
      signerSlots: [{ role: 'SIGNER', order: 1 }],
      expirationDays: 30,
      reminderDays: 7,
    });

    expect(result.template).toEqual(template);
    expect(mocks.templatesRepository.create).toHaveBeenCalledWith({
      tenantId,
      name: 'Standard Contract',
      description: 'Template for standard contracts',
      signatureLevel: 'ADVANCED',
      routingType: 'SEQUENTIAL',
      signerSlots: [{ role: 'SIGNER', order: 1 }],
      expirationDays: 30,
      reminderDays: 7,
    });
  });

  it('should create a template without optional fields', async () => {
    const template = {
      id: new UniqueEntityID(),
      tenantId,
      name: 'Simple',
      signatureLevel: 'SIMPLE',
      routingType: 'PARALLEL',
    };

    mocks.templatesRepository.create.mockResolvedValue(template);

    const result = await mocks.sut.execute({
      tenantId,
      name: 'Simple',
      signatureLevel: 'SIMPLE',
      routingType: 'PARALLEL',
      signerSlots: [],
    });

    expect(result.template).toEqual(template);
    expect(mocks.templatesRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Simple',
        signatureLevel: 'SIMPLE',
        routingType: 'PARALLEL',
      }),
    );
  });
});
