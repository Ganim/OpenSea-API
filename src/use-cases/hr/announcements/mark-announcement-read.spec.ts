import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { InMemoryAnnouncementReadReceiptsRepository } from '@/repositories/hr/in-memory/in-memory-announcement-read-receipts-repository';
import { InMemoryCompanyAnnouncementsRepository } from '@/repositories/hr/in-memory/in-memory-company-announcements-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it } from 'vitest';
import { MarkAnnouncementReadUseCase } from './mark-announcement-read';

let announcementsRepository: InMemoryCompanyAnnouncementsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let receiptsRepository: InMemoryAnnouncementReadReceiptsRepository;
let sut: MarkAnnouncementReadUseCase;

const tenantId = new UniqueEntityID();
const tenantIdString = tenantId.toString();

describe('Mark Announcement Read Use Case', () => {
  beforeEach(() => {
    announcementsRepository = new InMemoryCompanyAnnouncementsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    receiptsRepository = new InMemoryAnnouncementReadReceiptsRepository();
    sut = new MarkAnnouncementReadUseCase(
      announcementsRepository,
      employeesRepository,
      receiptsRepository,
    );
  });

  async function persistAnnouncement(): Promise<CompanyAnnouncement> {
    const announcement = CompanyAnnouncement.create({
      tenantId,
      title: 'Announcement title',
      content: 'Announcement content',
      priority: 'NORMAL',
      isActive: true,
      publishedAt: new Date(),
    });
    await announcementsRepository.create(announcement);
    return announcement;
  }

  async function persistEmployeeWithUser(userId: UniqueEntityID) {
    const blueprint = makeEmployee({
      tenantId,
      userId,
      status: EmployeeStatus.ACTIVE(),
    });
    return employeesRepository.create({
      tenantId: tenantIdString,
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

  it('persists a read receipt the first time it is marked', async () => {
    const userId = new UniqueEntityID();
    const announcement = await persistAnnouncement();
    const employee = await persistEmployeeWithUser(userId);

    const { receipt } = await sut.execute({
      tenantId: tenantIdString,
      announcementId: announcement.id.toString(),
      userId: userId.toString(),
    });

    expect(receipt.announcementId.equals(announcement.id)).toBe(true);
    expect(receipt.employeeId.equals(employee.id)).toBe(true);
    expect(receiptsRepository.items).toHaveLength(1);
  });

  it('is idempotent — calling twice does not duplicate receipts', async () => {
    const userId = new UniqueEntityID();
    const announcement = await persistAnnouncement();
    await persistEmployeeWithUser(userId);

    await sut.execute({
      tenantId: tenantIdString,
      announcementId: announcement.id.toString(),
      userId: userId.toString(),
    });

    await sut.execute({
      tenantId: tenantIdString,
      announcementId: announcement.id.toString(),
      userId: userId.toString(),
    });

    expect(receiptsRepository.items).toHaveLength(1);
  });

  it('throws ResourceNotFoundError when the announcement does not exist', async () => {
    const userId = new UniqueEntityID();
    await persistEmployeeWithUser(userId);

    await expect(
      sut.execute({
        tenantId: tenantIdString,
        announcementId: new UniqueEntityID().toString(),
        userId: userId.toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('throws ResourceNotFoundError when the user has no linked employee', async () => {
    const announcement = await persistAnnouncement();

    await expect(
      sut.execute({
        tenantId: tenantIdString,
        announcementId: announcement.id.toString(),
        userId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });
});
