import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryAnnouncementReadReceiptsRepository } from '@/repositories/hr/in-memory/in-memory-announcement-read-receipts-repository';
import { InMemoryCompanyAnnouncementsRepository } from '@/repositories/hr/in-memory/in-memory-company-announcements-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListAnnouncementsUseCase } from './list-announcements';
import { ResolveAudienceUseCase } from './resolve-audience';

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

describe('List Announcements Use Case (read-status enrichment)', () => {
  let receiptsRepository: InMemoryAnnouncementReadReceiptsRepository;
  let employeesRepository: InMemoryEmployeesRepository;
  let teamMembersRepository: InMemoryTeamMembersRepository;
  let resolveAudienceUseCase: ResolveAudienceUseCase;
  let enrichedSut: ListAnnouncementsUseCase;
  let enrichedAnnouncementsRepository: InMemoryCompanyAnnouncementsRepository;
  const enrichedTenantId = new UniqueEntityID();
  const enrichedTenantIdString = enrichedTenantId.toString();

  beforeEach(() => {
    enrichedAnnouncementsRepository =
      new InMemoryCompanyAnnouncementsRepository();
    receiptsRepository = new InMemoryAnnouncementReadReceiptsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    enrichedAnnouncementsRepository.receiptsRepository = receiptsRepository;
    resolveAudienceUseCase = new ResolveAudienceUseCase(
      employeesRepository,
      teamMembersRepository,
    );
    enrichedSut = new ListAnnouncementsUseCase(
      enrichedAnnouncementsRepository,
      receiptsRepository,
      employeesRepository,
      resolveAudienceUseCase,
    );
  });

  async function persistEmployee(userId: UniqueEntityID) {
    const blueprint = makeEmployee({
      tenantId: enrichedTenantId,
      userId,
      status: EmployeeStatus.ACTIVE(),
    });
    return employeesRepository.create({
      tenantId: enrichedTenantIdString,
      registrationNumber: blueprint.registrationNumber,
      userId: blueprint.userId,
      fullName: blueprint.fullName,
      cpf: blueprint.cpf,
      country: blueprint.country,
      hireDate: blueprint.hireDate,
      status: blueprint.status,
      contractType: blueprint.contractType,
      workRegime: blueprint.workRegime,
      weeklyHours: blueprint.weeklyHours,
    });
  }

  it('enriches list items with isReadByMe, readCount, audienceCount', async () => {
    const userId = new UniqueEntityID();
    const employee = await persistEmployee(userId);
    await persistEmployee(new UniqueEntityID());

    const readAnnouncement = CompanyAnnouncement.create({
      tenantId: enrichedTenantId,
      title: 'Read announcement',
      content: 'Already read.',
      priority: 'NORMAL',
      isActive: true,
    });
    const unreadAnnouncement = CompanyAnnouncement.create({
      tenantId: enrichedTenantId,
      title: 'Unread announcement',
      content: 'Not yet read.',
      priority: 'NORMAL',
      isActive: true,
    });
    await enrichedAnnouncementsRepository.create(readAnnouncement);
    await enrichedAnnouncementsRepository.create(unreadAnnouncement);

    await receiptsRepository.markAsRead({
      tenantId: enrichedTenantId,
      announcementId: readAnnouncement.id,
      employeeId: employee.id,
    });

    const result = await enrichedSut.execute({
      tenantId: enrichedTenantIdString,
      page: 1,
      limit: 20,
      currentUserId: userId.toString(),
    });

    expect(result.items).toHaveLength(2);
    const readItem = result.items.find((item) =>
      item.announcement.id.equals(readAnnouncement.id),
    );
    const unreadItem = result.items.find((item) =>
      item.announcement.id.equals(unreadAnnouncement.id),
    );
    expect(readItem?.isReadByMe).toBe(true);
    expect(readItem?.readCount).toBe(1);
    expect(readItem?.audienceCount).toBe(2);
    expect(unreadItem?.isReadByMe).toBe(false);
    expect(unreadItem?.readCount).toBe(0);
    expect(unreadItem?.audienceCount).toBe(2);
  });

  it('filters out read announcements when unreadOnly=true', async () => {
    const userId = new UniqueEntityID();
    const employee = await persistEmployee(userId);

    const readAnnouncement = CompanyAnnouncement.create({
      tenantId: enrichedTenantId,
      title: 'Read',
      content: 'Read.',
      priority: 'NORMAL',
      isActive: true,
    });
    const unreadAnnouncement = CompanyAnnouncement.create({
      tenantId: enrichedTenantId,
      title: 'Unread',
      content: 'Unread.',
      priority: 'NORMAL',
      isActive: true,
    });
    await enrichedAnnouncementsRepository.create(readAnnouncement);
    await enrichedAnnouncementsRepository.create(unreadAnnouncement);

    await receiptsRepository.markAsRead({
      tenantId: enrichedTenantId,
      announcementId: readAnnouncement.id,
      employeeId: employee.id,
    });

    const result = await enrichedSut.execute({
      tenantId: enrichedTenantIdString,
      page: 1,
      limit: 20,
      unreadOnly: true,
      currentUserId: userId.toString(),
    });

    expect(result.announcements).toHaveLength(1);
    expect(result.announcements[0].id.equals(unreadAnnouncement.id)).toBe(true);
  });
});
