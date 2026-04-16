import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryAnnouncementReadReceiptsRepository } from '@/repositories/hr/in-memory/in-memory-announcement-read-receipts-repository';
import { InMemoryCompanyAnnouncementsRepository } from '@/repositories/hr/in-memory/in-memory-company-announcements-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it } from 'vitest';
import { GetAnnouncementStatsUseCase } from './get-announcement-stats';
import { ResolveAudienceUseCase } from './resolve-audience';

let announcementsRepository: InMemoryCompanyAnnouncementsRepository;
let receiptsRepository: InMemoryAnnouncementReadReceiptsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let resolveAudienceUseCase: ResolveAudienceUseCase;
let sut: GetAnnouncementStatsUseCase;

const tenantId = new UniqueEntityID();
const tenantIdString = tenantId.toString();

async function persistEmployee() {
  const blueprint = makeEmployee({
    tenantId,
    status: EmployeeStatus.ACTIVE(),
  });
  return employeesRepository.create({
    tenantId: tenantIdString,
    registrationNumber: blueprint.registrationNumber,
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

describe('Get Announcement Stats Use Case', () => {
  beforeEach(() => {
    announcementsRepository = new InMemoryCompanyAnnouncementsRepository();
    receiptsRepository = new InMemoryAnnouncementReadReceiptsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    resolveAudienceUseCase = new ResolveAudienceUseCase(
      employeesRepository,
      teamMembersRepository,
    );
    sut = new GetAnnouncementStatsUseCase(
      announcementsRepository,
      receiptsRepository,
      resolveAudienceUseCase,
    );
  });

  it('returns aggregated read metrics for an announcement', async () => {
    const announcement = CompanyAnnouncement.create({
      tenantId,
      title: 'Stats announcement',
      content: 'Stats content',
      priority: 'NORMAL',
      isActive: true,
    });
    await announcementsRepository.create(announcement);

    const reader = await persistEmployee();
    await persistEmployee();
    await persistEmployee();
    await persistEmployee();

    await receiptsRepository.markAsRead({
      tenantId,
      announcementId: announcement.id,
      employeeId: reader.id,
    });

    const stats = await sut.execute({
      tenantId: tenantIdString,
      announcementId: announcement.id.toString(),
    });

    expect(stats.totalAudience).toBe(4);
    expect(stats.readCount).toBe(1);
    expect(stats.unreadCount).toBe(3);
    expect(stats.readPercentage).toBe(25);
    expect(stats.recentReaders).toHaveLength(1);
    expect(stats.recentReaders[0].employee.id.equals(reader.id)).toBe(true);
  });

  it('returns zeroed stats when the audience is empty', async () => {
    const announcement = CompanyAnnouncement.create({
      tenantId,
      title: 'Empty audience',
      content: 'Content',
      priority: 'NORMAL',
      isActive: true,
    });
    await announcementsRepository.create(announcement);

    const stats = await sut.execute({
      tenantId: tenantIdString,
      announcementId: announcement.id.toString(),
    });

    expect(stats.totalAudience).toBe(0);
    expect(stats.readCount).toBe(0);
    expect(stats.unreadCount).toBe(0);
    expect(stats.readPercentage).toBe(0);
    expect(stats.recentReaders).toHaveLength(0);
  });

  it('throws when the announcement does not exist', async () => {
    await expect(
      sut.execute({
        tenantId: tenantIdString,
        announcementId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
