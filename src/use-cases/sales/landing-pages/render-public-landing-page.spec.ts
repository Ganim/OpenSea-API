import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { FormField } from '@/entities/sales/form-field';
import { LandingPage } from '@/entities/sales/landing-page';
import { InMemoryFormFieldsRepository } from '@/repositories/sales/in-memory/in-memory-form-fields-repository';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { RenderPublicLandingPageUseCase } from './render-public-landing-page';

let landingPagesRepository: InMemoryLandingPagesRepository;
let formFieldsRepository: InMemoryFormFieldsRepository;
let renderPublicLandingPage: RenderPublicLandingPageUseCase;

describe('RenderPublicLandingPageUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    formFieldsRepository = new InMemoryFormFieldsRepository();
    renderPublicLandingPage = new RenderPublicLandingPageUseCase(
      landingPagesRepository,
      formFieldsRepository,
    );
  });

  it('should render a published landing page', async () => {
    const tenantId = 'tenant-1';
    const tenantSlug = 'demo-company';
    landingPagesRepository.tenantSlugs.set(tenantId, tenantSlug);

    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID(tenantId),
      title: 'Summer Sale',
      slug: 'summer-sale',
      description: 'Great deals!',
      template: 'lead-capture',
      content: { hero: { heading: 'Summer Sale!' } },
      createdBy: 'user-1',
      status: 'PUBLISHED',
      isPublished: true,
    });
    landingPagesRepository.items.push(landingPage);

    const result = await renderPublicLandingPage.execute({
      tenantSlug: 'demo-company',
      pageSlug: 'summer-sale',
    });

    expect(result.title).toBe('Summer Sale');
    expect(result.template).toBe('lead-capture');
    expect(result.content).toEqual({ hero: { heading: 'Summer Sale!' } });
  });

  it('should include form fields when form is linked', async () => {
    const tenantId = 'tenant-1';
    const formId = 'form-1';
    landingPagesRepository.tenantSlugs.set(tenantId, 'demo-company');

    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID(tenantId),
      title: 'Contact Us',
      slug: 'contact-us',
      template: 'lead-capture',
      formId,
      createdBy: 'user-1',
      status: 'PUBLISHED',
      isPublished: true,
    });
    landingPagesRepository.items.push(landingPage);

    const nameField = FormField.create({
      formId: new UniqueEntityID(formId),
      label: 'Name',
      type: 'TEXT',
      isRequired: true,
      order: 0,
    });
    const emailField = FormField.create({
      formId: new UniqueEntityID(formId),
      label: 'Email',
      type: 'EMAIL',
      isRequired: true,
      order: 1,
    });
    formFieldsRepository.items.push(nameField, emailField);

    const result = await renderPublicLandingPage.execute({
      tenantSlug: 'demo-company',
      pageSlug: 'contact-us',
    });

    expect(result.formFields).toHaveLength(2);
    expect(result.formFields![0].label).toBe('Name');
    expect(result.formFields![1].label).toBe('Email');
  });

  it('should throw if landing page not found', async () => {
    await expect(() =>
      renderPublicLandingPage.execute({
        tenantSlug: 'non-existent',
        pageSlug: 'non-existent',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });

  it('should not render unpublished landing pages', async () => {
    const tenantId = 'tenant-1';
    landingPagesRepository.tenantSlugs.set(tenantId, 'demo-company');

    const landingPage = LandingPage.create({
      tenantId: new UniqueEntityID(tenantId),
      title: 'Draft Page',
      slug: 'draft-page',
      createdBy: 'user-1',
      status: 'DRAFT',
    });
    landingPagesRepository.items.push(landingPage);

    await expect(() =>
      renderPublicLandingPage.execute({
        tenantSlug: 'demo-company',
        pageSlug: 'draft-page',
      }),
    ).rejects.toThrow(ResourceNotFoundError);
  });
});
