import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryCompanyAnnouncementsRepository } from '@/repositories/hr/in-memory/in-memory-company-announcements-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateAnnouncementUseCase } from './create-announcement';

let companyAnnouncementsRepository: InMemoryCompanyAnnouncementsRepository;
let sut: CreateAnnouncementUseCase;

const tenantId = new UniqueEntityID().toString();
const authorEmployeeId = new UniqueEntityID().toString();

describe('Create Announcement Use Case', () => {
  beforeEach(() => {
    companyAnnouncementsRepository =
      new InMemoryCompanyAnnouncementsRepository();
    sut = new CreateAnnouncementUseCase(companyAnnouncementsRepository);
  });

  it('should create a NORMAL priority announcement successfully', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Company Picnic',
      content: 'Annual company picnic scheduled for next month.',
      priority: 'NORMAL',
      authorEmployeeId,
    });

    expect(result.announcement).toBeDefined();
    expect(result.announcement.title).toBe('Company Picnic');
    expect(result.announcement.content).toBe(
      'Annual company picnic scheduled for next month.',
    );
    expect(result.announcement.priority).toBe('NORMAL');
    expect(result.announcement.isActive).toBe(true);
  });

  it('should create an IMPORTANT priority announcement', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Policy Update',
      content: 'New remote work policy effective immediately.',
      priority: 'IMPORTANT',
    });

    expect(result.announcement.priority).toBe('IMPORTANT');
  });

  it('should create an URGENT priority announcement', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'System Maintenance',
      content: 'Emergency system maintenance tonight at 10 PM.',
      priority: 'URGENT',
    });

    expect(result.announcement.priority).toBe('URGENT');
  });

  it('should default priority to NORMAL when not specified', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'General Update',
      content: 'Some general information for employees.',
    });

    expect(result.announcement.priority).toBe('NORMAL');
  });

  it('should throw error for invalid priority', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Test',
        content: 'Test content',
        priority: 'CRITICAL',
      }),
    ).rejects.toThrow(
      'Invalid priority: CRITICAL. Valid priorities: NORMAL, IMPORTANT, URGENT',
    );
  });

  it('should throw error when title is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: '',
        content: 'Content without title',
      }),
    ).rejects.toThrow('Announcement title is required');
  });

  it('should throw error when title is whitespace only', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: '   ',
        content: 'Content',
      }),
    ).rejects.toThrow('Announcement title is required');
  });

  it('should throw error when content is empty', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Title',
        content: '',
      }),
    ).rejects.toThrow('Announcement content is required');
  });

  it('should throw error when content is whitespace only', async () => {
    await expect(
      sut.execute({
        tenantId,
        title: 'Title',
        content: '   ',
      }),
    ).rejects.toThrow('Announcement content is required');
  });

  it('should trim title and content', async () => {
    const result = await sut.execute({
      tenantId,
      title: '  Trimmed Title  ',
      content: '  Trimmed Content  ',
    });

    expect(result.announcement.title).toBe('Trimmed Title');
    expect(result.announcement.content).toBe('Trimmed Content');
  });

  it('should set publishedAt when publishNow is true (default)', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Published Now',
      content: 'This should be published immediately.',
    });

    expect(result.announcement.publishedAt).toBeInstanceOf(Date);
    expect(result.announcement.isPublished()).toBe(true);
  });

  it('should not set publishedAt when publishNow is false', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Draft Announcement',
      content: 'This is a draft.',
      publishNow: false,
    });

    expect(result.announcement.publishedAt).toBeUndefined();
    expect(result.announcement.isPublished()).toBe(false);
  });

  it('should set expiration date when provided', async () => {
    const expiresAt = new Date('2026-12-31');

    const result = await sut.execute({
      tenantId,
      title: 'Expiring Announcement',
      content: 'This announcement expires at the end of the year.',
      expiresAt,
    });

    expect(result.announcement.expiresAt).toEqual(expiresAt);
  });

  it('should set author employee id when provided', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Authored Announcement',
      content: 'Posted by a specific employee.',
      authorEmployeeId,
    });

    expect(result.announcement.authorEmployeeId?.toString()).toBe(
      authorEmployeeId,
    );
  });

  it('should set target department ids when provided', async () => {
    const targetDepartmentIds = [
      new UniqueEntityID().toString(),
      new UniqueEntityID().toString(),
    ];

    const result = await sut.execute({
      tenantId,
      title: 'Department-specific Announcement',
      content: 'This is targeted to specific departments.',
      targetDepartmentIds,
    });

    expect(result.announcement.targetDepartmentIds).toEqual(
      targetDepartmentIds,
    );
    expect(result.announcement.isTargetedToAll()).toBe(false);
  });

  it('should accept all extended audience dimensions', async () => {
    const targetDepartmentIds = [new UniqueEntityID().toString()];
    const targetTeamIds = [new UniqueEntityID().toString()];
    const targetRoleIds = [new UniqueEntityID().toString()];
    const targetEmployeeIds = [new UniqueEntityID().toString()];

    const result = await sut.execute({
      tenantId,
      title: 'Multi-target Announcement',
      content: 'Targets across multiple dimensions.',
      targetDepartmentIds,
      targetTeamIds,
      targetRoleIds,
      targetEmployeeIds,
    });

    const audienceTargets = result.announcement.audienceTargets;
    expect(audienceTargets.departments).toEqual(targetDepartmentIds);
    expect(audienceTargets.teams).toEqual(targetTeamIds);
    expect(audienceTargets.roles).toEqual(targetRoleIds);
    expect(audienceTargets.employees).toEqual(targetEmployeeIds);
    expect(result.announcement.isTargetedToAll()).toBe(false);
  });

  it('should report zero notifications created when no notifier is wired', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'No notifier',
      content: 'Without notifier wired.',
    });

    expect(result.notificationsCreated).toBe(0);
  });

  it('should target all departments when targetDepartmentIds is not provided', async () => {
    const result = await sut.execute({
      tenantId,
      title: 'Global Announcement',
      content: 'For everyone.',
    });

    expect(result.announcement.isTargetedToAll()).toBe(true);
  });

  it('should persist the announcement in the repository', async () => {
    await sut.execute({
      tenantId,
      title: 'Persisted Announcement',
      content: 'Should be stored.',
    });

    expect(companyAnnouncementsRepository.items).toHaveLength(1);
    expect(companyAnnouncementsRepository.items[0].title).toBe(
      'Persisted Announcement',
    );
  });
});
