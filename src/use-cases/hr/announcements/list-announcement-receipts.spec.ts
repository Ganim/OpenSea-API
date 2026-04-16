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
import { ListAnnouncementReceiptsUseCase } from './list-announcement-receipts';
import { ResolveAudienceUseCase } from './resolve-audience';

let announcementsRepository: InMemoryCompanyAnnouncementsRepository;
let receiptsRepository: InMemoryAnnouncementReadReceiptsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let resolveAudienceUseCase: ResolveAudienceUseCase;
let sut: ListAnnouncementReceiptsUseCase;

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

describe('List Announcement Receipts Use Case', () => {
  beforeEach(() => {
    announcementsRepository = new InMemoryCompanyAnnouncementsRepository();
    receiptsRepository = new InMemoryAnnouncementReadReceiptsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    resolveAudienceUseCase = new ResolveAudienceUseCase(
      employeesRepository,
      teamMembersRepository,
    );
    sut = new ListAnnouncementReceiptsUseCase(
      announcementsRepository,
      receiptsRepository,
      resolveAudienceUseCase,
    );
  });

  it('partitions audience into readers and nonReaders', async () => {
    const announcement = CompanyAnnouncement.create({
      tenantId,
      title: 'Announcement',
      content: 'Content',
      priority: 'NORMAL',
      isActive: true,
    });
    await announcementsRepository.create(announcement);

    const reader = await persistEmployee();
    const otherReader = await persistEmployee();
    const nonReader = await persistEmployee();

    await receiptsRepository.markAsRead({
      tenantId,
      announcementId: announcement.id,
      employeeId: reader.id,
    });
    await receiptsRepository.markAsRead({
      tenantId,
      announcementId: announcement.id,
      employeeId: otherReader.id,
    });

    const { readers, nonReaders } = await sut.execute({
      tenantId: tenantIdString,
      announcementId: announcement.id.toString(),
    });

    expect(readers).toHaveLength(2);
    expect(nonReaders).toHaveLength(1);
    expect(nonReaders[0].id.equals(nonReader.id)).toBe(true);
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
