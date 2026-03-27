import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { InMemoryEmployeeKudosRepository } from '@/repositories/hr/in-memory/in-memory-employee-kudos-repository';
import { describe, it, expect, beforeEach } from 'vitest';
import { SendKudosUseCase } from './send-kudos';

let employeeKudosRepository: InMemoryEmployeeKudosRepository;
let sendKudosUseCase: SendKudosUseCase;

const TENANT_ID = new UniqueEntityID().toString();
const SENDER_EMPLOYEE_ID = new UniqueEntityID().toString();
const RECIPIENT_EMPLOYEE_ID = new UniqueEntityID().toString();

describe('SendKudosUseCase', () => {
  beforeEach(() => {
    employeeKudosRepository = new InMemoryEmployeeKudosRepository();
    sendKudosUseCase = new SendKudosUseCase(employeeKudosRepository);
  });

  it('should send kudos successfully', async () => {
    const { kudos } = await sendKudosUseCase.execute({
      tenantId: TENANT_ID,
      fromEmployeeId: SENDER_EMPLOYEE_ID,
      toEmployeeId: RECIPIENT_EMPLOYEE_ID,
      message: 'Great teamwork on the project!',
      category: 'TEAMWORK',
      isPublic: true,
    });

    expect(kudos.fromEmployeeId.toString()).toBe(SENDER_EMPLOYEE_ID);
    expect(kudos.toEmployeeId.toString()).toBe(RECIPIENT_EMPLOYEE_ID);
    expect(kudos.message).toBe('Great teamwork on the project!');
    expect(kudos.category).toBe('TEAMWORK');
    expect(kudos.isPublic).toBe(true);
    expect(kudos.createdAt).toBeInstanceOf(Date);
    expect(employeeKudosRepository.items).toHaveLength(1);
  });

  it('should not allow sending kudos to yourself', async () => {
    await expect(
      sendKudosUseCase.execute({
        tenantId: TENANT_ID,
        fromEmployeeId: SENDER_EMPLOYEE_ID,
        toEmployeeId: SENDER_EMPLOYEE_ID,
        message: 'Self praise',
        category: 'EXCELLENCE',
      }),
    ).rejects.toThrow(BadRequestError);

    await expect(
      sendKudosUseCase.execute({
        tenantId: TENANT_ID,
        fromEmployeeId: SENDER_EMPLOYEE_ID,
        toEmployeeId: SENDER_EMPLOYEE_ID,
        message: 'Self praise',
        category: 'EXCELLENCE',
      }),
    ).rejects.toThrow('You cannot send kudos to yourself');
  });

  it('should reject empty message', async () => {
    await expect(
      sendKudosUseCase.execute({
        tenantId: TENANT_ID,
        fromEmployeeId: SENDER_EMPLOYEE_ID,
        toEmployeeId: RECIPIENT_EMPLOYEE_ID,
        message: '',
        category: 'INNOVATION',
      }),
    ).rejects.toThrow('Kudos message is required');
  });

  it('should reject whitespace-only message', async () => {
    await expect(
      sendKudosUseCase.execute({
        tenantId: TENANT_ID,
        fromEmployeeId: SENDER_EMPLOYEE_ID,
        toEmployeeId: RECIPIENT_EMPLOYEE_ID,
        message: '   ',
        category: 'INNOVATION',
      }),
    ).rejects.toThrow('Kudos message is required');
  });

  it('should reject invalid category', async () => {
    await expect(
      sendKudosUseCase.execute({
        tenantId: TENANT_ID,
        fromEmployeeId: SENDER_EMPLOYEE_ID,
        toEmployeeId: RECIPIENT_EMPLOYEE_ID,
        message: 'Good job',
        category: 'INVALID_CATEGORY',
      }),
    ).rejects.toThrow('Invalid category');
  });

  it('should default isPublic to true', async () => {
    const { kudos } = await sendKudosUseCase.execute({
      tenantId: TENANT_ID,
      fromEmployeeId: SENDER_EMPLOYEE_ID,
      toEmployeeId: RECIPIENT_EMPLOYEE_ID,
      message: 'Nice work!',
      category: 'HELPFULNESS',
    });

    expect(kudos.isPublic).toBe(true);
  });

  it('should allow sending private kudos', async () => {
    const { kudos } = await sendKudosUseCase.execute({
      tenantId: TENANT_ID,
      fromEmployeeId: SENDER_EMPLOYEE_ID,
      toEmployeeId: RECIPIENT_EMPLOYEE_ID,
      message: 'Private recognition',
      category: 'LEADERSHIP',
      isPublic: false,
    });

    expect(kudos.isPublic).toBe(false);
  });

  it('should trim the message', async () => {
    const { kudos } = await sendKudosUseCase.execute({
      tenantId: TENANT_ID,
      fromEmployeeId: SENDER_EMPLOYEE_ID,
      toEmployeeId: RECIPIENT_EMPLOYEE_ID,
      message: '  Great work!  ',
      category: 'EXCELLENCE',
    });

    expect(kudos.message).toBe('Great work!');
  });
});
