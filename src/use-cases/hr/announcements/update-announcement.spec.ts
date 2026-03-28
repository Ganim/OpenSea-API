import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import { InMemoryCompanyAnnouncementsRepository } from '@/repositories/hr/in-memory/in-memory-company-announcements-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { UpdateAnnouncementUseCase } from './update-announcement';

let companyAnnouncementsRepository: InMemoryCompanyAnnouncementsRepository;
let sut: UpdateAnnouncementUseCase;

const tenantId = new UniqueEntityID().toString();
let existingAnnouncement: CompanyAnnouncement;

describe('Update Announcement Use Case', () => {
  beforeEach(() => {
    companyAnnouncementsRepository =
      new InMemoryCompanyAnnouncementsRepository();
    sut = new UpdateAnnouncementUseCase(companyAnnouncementsRepository);

    existingAnnouncement = CompanyAnnouncement.create({
      tenantId: new UniqueEntityID(tenantId),
      title: 'Original Title',
      content: 'Original content.',
      priority: 'NORMAL',
      isActive: true,
      publishedAt: new Date(),
    });

    companyAnnouncementsRepository.items.push(existingAnnouncement);
  });

  it('should update announcement title', async () => {
    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      title: 'Updated Title',
    });

    expect(result.announcement.title).toBe('Updated Title');
  });

  it('should update announcement content', async () => {
    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      content: 'Updated content with more details.',
    });

    expect(result.announcement.content).toBe(
      'Updated content with more details.',
    );
  });

  it('should update announcement priority', async () => {
    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      priority: 'URGENT',
    });

    expect(result.announcement.priority).toBe('URGENT');
  });

  it('should update announcement expiration date', async () => {
    const newExpiresAt = new Date('2026-12-31');

    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      expiresAt: newExpiresAt,
    });

    expect(result.announcement.expiresAt).toEqual(newExpiresAt);
  });

  it('should update target department ids', async () => {
    const departmentIds = [
      new UniqueEntityID().toString(),
      new UniqueEntityID().toString(),
    ];

    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      targetDepartmentIds: departmentIds,
    });

    expect(result.announcement.targetDepartmentIds).toEqual(departmentIds);
    expect(result.announcement.isTargetedToAll()).toBe(false);
  });

  it('should update multiple fields at once', async () => {
    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      title: 'New Title',
      content: 'New Content',
      priority: 'IMPORTANT',
    });

    expect(result.announcement.title).toBe('New Title');
    expect(result.announcement.content).toBe('New Content');
    expect(result.announcement.priority).toBe('IMPORTANT');
  });

  it('should keep unchanged fields intact', async () => {
    const result = await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      title: 'Only Title Changed',
    });

    expect(result.announcement.title).toBe('Only Title Changed');
    expect(result.announcement.content).toBe('Original content.');
    expect(result.announcement.priority).toBe('NORMAL');
  });

  it('should throw error when announcement not found', async () => {
    await expect(
      sut.execute({
        tenantId,
        announcementId: new UniqueEntityID().toString(),
        title: 'Does Not Exist',
      }),
    ).rejects.toThrow('Announcement not found');
  });

  it('should throw error when announcement belongs to a different tenant', async () => {
    const differentTenantId = new UniqueEntityID().toString();

    await expect(
      sut.execute({
        tenantId: differentTenantId,
        announcementId: existingAnnouncement.id.toString(),
        title: 'Cross Tenant Update',
      }),
    ).rejects.toThrow('Announcement not found');
  });

  it('should persist the updated announcement in the repository', async () => {
    await sut.execute({
      tenantId,
      announcementId: existingAnnouncement.id.toString(),
      title: 'Persisted Update',
    });

    const storedAnnouncement = await companyAnnouncementsRepository.findById(
      existingAnnouncement.id,
      tenantId,
    );

    expect(storedAnnouncement?.title).toBe('Persisted Update');
  });
});
