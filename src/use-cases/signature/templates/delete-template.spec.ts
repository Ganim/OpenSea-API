import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureTemplate } from '@/entities/signature/signature-template';
import { InMemorySignatureTemplatesRepository } from '@/repositories/signature/in-memory/in-memory-signature-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { DeleteSignatureTemplateUseCase } from './delete-template';

const TENANT_ID = 'tenant-1';
const OTHER_TENANT_ID = 'tenant-2';

let templatesRepository: InMemorySignatureTemplatesRepository;
let sut: DeleteSignatureTemplateUseCase;

function seedTemplate() {
  const template = SignatureTemplate.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    name: 'Standard Contract',
    description: 'Template for standard contracts',
    signatureLevel: 'ADVANCED',
    routingType: 'SEQUENTIAL',
    signerSlots: [{ order: 1, group: 1, role: 'SIGNER', label: 'Signatário' }],
    expirationDays: 30,
    reminderDays: 7,
    isActive: true,
  });
  templatesRepository.items.push(template);
  return template;
}

describe('DeleteSignatureTemplateUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemorySignatureTemplatesRepository();
    sut = new DeleteSignatureTemplateUseCase(templatesRepository);
  });

  it('should delete an existing template owned by the tenant', async () => {
    const template = seedTemplate();

    await sut.execute({
      tenantId: TENANT_ID,
      templateId: template.id.toString(),
    });

    expect(templatesRepository.items).toHaveLength(0);
  });

  it('should throw ResourceNotFoundError when template does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        templateId: '00000000-0000-0000-0000-000000000000',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when tenant does not match', async () => {
    const template = seedTemplate();

    await expect(
      sut.execute({
        tenantId: OTHER_TENANT_ID,
        templateId: template.id.toString(),
      }),
    ).rejects.toThrow(ResourceNotFoundError);

    // Template must remain intact
    expect(templatesRepository.items).toHaveLength(1);
  });
});
