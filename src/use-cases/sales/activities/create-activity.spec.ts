import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryActivitiesRepository } from '@/repositories/sales/in-memory/in-memory-activities-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateActivityUseCase } from './create-activity';

let activitiesRepository: InMemoryActivitiesRepository;
let sut: CreateActivityUseCase;

const TENANT_ID = 'tenant-1';

describe('CreateActivityUseCase', () => {
  beforeEach(() => {
    activitiesRepository = new InMemoryActivitiesRepository();
    sut = new CreateActivityUseCase(activitiesRepository);
  });

  it('should create a NOTE activity', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      type: 'NOTE',
      title: 'Follow-up note',
      contactId: 'contact-1',
      description: 'Discussed pricing options',
    });

    expect(result.activity.id).toBeDefined();
    expect(result.activity.type).toBe('NOTE');
    expect(result.activity.title).toBe('Follow-up note');
    expect(result.activity.description).toBe('Discussed pricing options');
    expect(result.activity.contactId?.toString()).toBe('contact-1');
    expect(result.activity.tenantId.toString()).toBe(TENANT_ID);
  });

  it('should create a CALL activity with duration and outcome', async () => {
    const result = await sut.execute({
      tenantId: TENANT_ID,
      type: 'CALL',
      title: 'Discovery call',
      customerId: 'customer-1',
      duration: 1800, // 30 minutes
      outcome: 'Interested in premium plan',
    });

    expect(result.activity.type).toBe('CALL');
    expect(result.activity.duration).toBe(1800);
    expect(result.activity.outcome).toBe('Interested in premium plan');
    expect(result.activity.customerId?.toString()).toBe('customer-1');
  });

  it('should create a TASK activity with dueAt', async () => {
    const dueDate = new Date('2026-04-01T10:00:00Z');
    const result = await sut.execute({
      tenantId: TENANT_ID,
      type: 'TASK',
      title: 'Send proposal',
      dealId: 'deal-1',
      dueAt: dueDate,
    });

    expect(result.activity.type).toBe('TASK');
    expect(result.activity.dueAt).toEqual(dueDate);
    expect(result.activity.dealId?.toString()).toBe('deal-1');
    expect(result.activity.completedAt).toBeUndefined();
  });

  it('should throw BadRequestError when title is empty', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        type: 'NOTE',
        title: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw BadRequestError when type is invalid', async () => {
    await expect(
      sut.execute({
        tenantId: TENANT_ID,
        type: 'INVALID_TYPE',
        title: 'Some activity',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
