import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import { InMemoryCompanyAnnouncementsRepository } from '@/repositories/hr/in-memory/in-memory-company-announcements-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAnnouncementsUseCase } from './list-announcements';

let companyAnnouncementsRepository: InMemoryCompanyAnnouncementsRepository;
let sut: ListAnnouncementsUseCase;

const tenantId = new UniqueEntityID().toString();

function createTestAnnouncement(
  overrides: Partial<{
    tenantId: string;
    title: string;
    isActive: boolean;
    priority: 'NORMAL' | 'IMPORTANT' | 'URGENT';
  }> = {},
): CompanyAnnouncement {
  return CompanyAnnouncement.create({
    tenantId: new UniqueEntityID(overrides.tenantId ?? tenantId),
    title: overrides.title ?? 'Test Announcement',
    content: 'Test content',
    priority: overrides.priority ?? 'NORMAL',
    isActive: overrides.isActive ?? true,
    publishedAt: new Date(),
  });
}

describe('List Announcements Use Case', () => {
  beforeEach(() => {
    companyAnnouncementsRepository =
      new InMemoryCompanyAnnouncementsRepository();
    sut = new ListAnnouncementsUseCase(companyAnnouncementsRepository);
  });

  it('should list active announcements', async () => {
    companyAnnouncementsRepository.items.push(
      createTestAnnouncement({ title: 'First' }),
      createTestAnnouncement({ title: 'Second' }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(result.announcements).toHaveLength(2);
    expect(result.total).toBe(2);
  });

  it('should not include inactive announcements', async () => {
    companyAnnouncementsRepository.items.push(
      createTestAnnouncement({ title: 'Active', isActive: true }),
      createTestAnnouncement({ title: 'Inactive', isActive: false }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(result.announcements).toHaveLength(1);
    expect(result.announcements[0].title).toBe('Active');
  });

  it('should not include announcements from other tenants', async () => {
    const otherTenantId = new UniqueEntityID().toString();
    companyAnnouncementsRepository.items.push(
      createTestAnnouncement({ title: 'Same Tenant' }),
      createTestAnnouncement({
        title: 'Other Tenant',
        tenantId: otherTenantId,
      }),
    );

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(result.announcements).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it('should paginate results correctly - first page', async () => {
    for (let i = 0; i < 5; i++) {
      companyAnnouncementsRepository.items.push(
        createTestAnnouncement({ title: `Announcement ${i + 1}` }),
      );
    }

    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 2,
    });

    expect(result.announcements).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  it('should paginate results correctly - second page', async () => {
    for (let i = 0; i < 5; i++) {
      companyAnnouncementsRepository.items.push(
        createTestAnnouncement({ title: `Announcement ${i + 1}` }),
      );
    }

    const result = await sut.execute({
      tenantId,
      page: 2,
      limit: 2,
    });

    expect(result.announcements).toHaveLength(2);
    expect(result.total).toBe(5);
  });

  it('should paginate results correctly - last page with partial results', async () => {
    for (let i = 0; i < 5; i++) {
      companyAnnouncementsRepository.items.push(
        createTestAnnouncement({ title: `Announcement ${i + 1}` }),
      );
    }

    const result = await sut.execute({
      tenantId,
      page: 3,
      limit: 2,
    });

    expect(result.announcements).toHaveLength(1);
    expect(result.total).toBe(5);
  });

  it('should return empty list when no active announcements exist', async () => {
    const result = await sut.execute({
      tenantId,
      page: 1,
      limit: 20,
    });

    expect(result.announcements).toHaveLength(0);
    expect(result.total).toBe(0);
  });

  it('should return empty list for page beyond available data', async () => {
    companyAnnouncementsRepository.items.push(
      createTestAnnouncement({ title: 'Only One' }),
    );

    const result = await sut.execute({
      tenantId,
      page: 10,
      limit: 20,
    });

    expect(result.announcements).toHaveLength(0);
    expect(result.total).toBe(1);
  });
});
