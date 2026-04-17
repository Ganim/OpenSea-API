import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { SignatureTemplate } from '@/entities/signature/signature-template';
import { InMemorySignatureTemplatesRepository } from '@/repositories/signature/in-memory/in-memory-signature-templates-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateSignatureTemplateUseCase } from './update-template';

const TENANT_ID = 'tenant-1';
const OTHER_TENANT_ID = 'tenant-2';

let templatesRepository: InMemorySignatureTemplatesRepository;
let sut: UpdateSignatureTemplateUseCase;

function seedTemplate(
  overrides: Partial<Parameters<typeof SignatureTemplate.create>[0]> = {},
) {
  const template = SignatureTemplate.create({
    tenantId: new UniqueEntityID(TENANT_ID),
    name: 'Standard Contract',
    description: 'Original description',
    signatureLevel: 'ADVANCED',
    routingType: 'SEQUENTIAL',
    signerSlots: [
      { order: 1, group: 1, role: 'SIGNER', label: 'Signatário' },
    ],
    expirationDays: 30,
    reminderDays: 7,
    isActive: true,
    ...overrides,
  });
  templatesRepository.items.push(template);
  return template;
}

describe('UpdateSignatureTemplateUseCase', () => {
  beforeEach(() => {
    templatesRepository = new InMemorySignatureTemplatesRepository();
    sut = new UpdateSignatureTemplateUseCase(templatesRepository);
  });

  it('should apply partial updates to an existing template', async () => {
    const template = seedTemplate();

    const { template: updatedTemplate } = await sut.execute({
      tenantId: TENANT_ID,
      templateId: template.id.toString(),
      name: 'Updated Contract Name',
      description: 'Updated description',
      reminderDays: 5,
    });

    expect(updatedTemplate.name).toBe('Updated Contract Name');
    expect(updatedTemplate.description).toBe('Updated description');
    expect(updatedTemplate.reminderDays).toBe(5);
    // Untouched fields preserved
    expect(updatedTemplate.signatureLevel).toBe('ADVANCED');
    expect(updatedTemplate.routingType).toBe('SEQUENTIAL');
    expect(updatedTemplate.expirationDays).toBe(30);
    expect(updatedTemplate.isActive).toBe(true);
  });

  it('should throw ResourceNotFoundError when template does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        templateId: '00000000-0000-0000-0000-000000000000',
        name: 'New name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should throw ResourceNotFoundError when tenant does not match', async () => {
    const template = seedTemplate();

    await expect(
      sut.execute({
        tenantId: OTHER_TENANT_ID,
        templateId: template.id.toString(),
        name: 'Hacked name',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should toggle isActive flag', async () => {
    const template = seedTemplate({ isActive: true });

    const { template: deactivatedTemplate } = await sut.execute({
      tenantId: TENANT_ID,
      templateId: template.id.toString(),
      isActive: false,
    });

    expect(deactivatedTemplate.isActive).toBe(false);
    expect(deactivatedTemplate.name).toBe('Standard Contract');
  });

  it('should reject invalid signatureLevel', async () => {
    const template = seedTemplate();

    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        templateId: template.id.toString(),
        signatureLevel: 'INVALID_LEVEL',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
