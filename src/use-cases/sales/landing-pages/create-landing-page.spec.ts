import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryLandingPagesRepository } from '@/repositories/sales/in-memory/in-memory-landing-pages-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLandingPageUseCase } from './create-landing-page';

let landingPagesRepository: InMemoryLandingPagesRepository;
let createLandingPage: CreateLandingPageUseCase;

describe('CreateLandingPageUseCase', () => {
  beforeEach(() => {
    landingPagesRepository = new InMemoryLandingPagesRepository();
    createLandingPage = new CreateLandingPageUseCase(landingPagesRepository);
  });

  it('should create a landing page', async () => {
    const result = await createLandingPage.execute({
      tenantId: 'tenant-1',
      title: 'Summer Sale',
      slug: 'summer-sale',
      description: 'A landing page for our summer sale',
      template: 'lead-capture',
      content: { hero: { heading: 'Summer Sale!' } },
      createdBy: 'user-1',
    });

    expect(result.landingPage).toBeDefined();
    expect(result.landingPage.title).toBe('Summer Sale');
    expect(result.landingPage.slug).toBe('summer-sale');
    expect(result.landingPage.status).toBe('DRAFT');
    expect(result.landingPage.isPublished).toBe(false);
    expect(result.landingPage.viewCount).toBe(0);
  });

  it('should create a landing page with default template', async () => {
    const result = await createLandingPage.execute({
      tenantId: 'tenant-1',
      title: 'Default Page',
      slug: 'default-page',
      createdBy: 'user-1',
    });

    expect(result.landingPage.template).toBe('lead-capture');
  });

  it('should not allow empty title', async () => {
    await expect(() =>
      createLandingPage.execute({
        tenantId: 'tenant-1',
        title: '',
        slug: 'test-page',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow title exceeding 255 characters', async () => {
    await expect(() =>
      createLandingPage.execute({
        tenantId: 'tenant-1',
        title: 'A'.repeat(256),
        slug: 'test-page',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow empty slug', async () => {
    await expect(() =>
      createLandingPage.execute({
        tenantId: 'tenant-1',
        title: 'Test Page',
        slug: '',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow invalid slug format', async () => {
    await expect(() =>
      createLandingPage.execute({
        tenantId: 'tenant-1',
        title: 'Test Page',
        slug: 'Invalid Slug!',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not allow duplicate slugs within same tenant', async () => {
    await createLandingPage.execute({
      tenantId: 'tenant-1',
      title: 'First Page',
      slug: 'my-page',
      createdBy: 'user-1',
    });

    await expect(() =>
      createLandingPage.execute({
        tenantId: 'tenant-1',
        title: 'Second Page',
        slug: 'my-page',
        createdBy: 'user-1',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow same slug in different tenants', async () => {
    await createLandingPage.execute({
      tenantId: 'tenant-1',
      title: 'First Page',
      slug: 'my-page',
      createdBy: 'user-1',
    });

    const result = await createLandingPage.execute({
      tenantId: 'tenant-2',
      title: 'Second Page',
      slug: 'my-page',
      createdBy: 'user-2',
    });

    expect(result.landingPage.slug).toBe('my-page');
  });
});
