import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { Employee } from '@/entities/hr/employee';
import {
  ContractType,
  CPF,
  EmployeeStatus,
  WorkRegime,
} from '@/entities/hr/value-objects';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { InMemoryOneOnOneActionItemsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-action-items-repository';
import { InMemoryOneOnOneMeetingsRepository } from '@/repositories/hr/in-memory/in-memory-one-on-one-meetings-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { AddActionItemUseCase } from './add-action-item';
import { DeleteActionItemUseCase } from './delete-action-item';
import { UpdateActionItemUseCase } from './update-action-item';

let meetingsRepository: InMemoryOneOnOneMeetingsRepository;
let actionItemsRepository: InMemoryOneOnOneActionItemsRepository;
let employeesRepository: InMemoryEmployeesRepository;
let addUseCase: AddActionItemUseCase;
let updateUseCase: UpdateActionItemUseCase;
let deleteUseCase: DeleteActionItemUseCase;
const tenantId = new UniqueEntityID().toString();
let manager: Employee;
let report: Employee;

describe('Action Item Use Cases', () => {
  beforeEach(async () => {
    meetingsRepository = new InMemoryOneOnOneMeetingsRepository();
    actionItemsRepository = new InMemoryOneOnOneActionItemsRepository();
    employeesRepository = new InMemoryEmployeesRepository();
    addUseCase = new AddActionItemUseCase(
      meetingsRepository,
      actionItemsRepository,
      employeesRepository,
    );
    updateUseCase = new UpdateActionItemUseCase(
      meetingsRepository,
      actionItemsRepository,
      employeesRepository,
    );
    deleteUseCase = new DeleteActionItemUseCase(
      meetingsRepository,
      actionItemsRepository,
    );

    manager = await employeesRepository.create({
      tenantId,
      registrationNumber: 'MGR-100',
      fullName: 'Renata Andrade',
      cpf: CPF.create('529.982.247-25'),
      hireDate: new Date('2019-04-01'),
      status: EmployeeStatus.ACTIVE(),
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });

    report = await employeesRepository.create({
      tenantId,
      registrationNumber: 'EMP-101',
      fullName: 'Lucas Cardoso',
      cpf: CPF.create('123.456.789-09'),
      hireDate: new Date('2024-02-01'),
      status: EmployeeStatus.ACTIVE(),
      contractType: ContractType.CLT(),
      workRegime: WorkRegime.FULL_TIME(),
      weeklyHours: 44,
      country: 'Brasil',
    });
  });

  it('should create action item assigned to a participant', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId: manager.id,
      reportId: report.id,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { actionItem } = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: manager.id.toString(),
      ownerId: report.id.toString(),
      content: 'Submit roadmap proposal',
    });

    expect(actionItem.ownerId.equals(report.id)).toBe(true);
    expect(actionItem.isCompleted).toBe(false);
  });

  it('should throw if owner does not exist', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId: manager.id,
      reportId: report.id,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    await expect(
      addUseCase.execute({
        tenantId,
        meetingId: meeting.id.toString(),
        authorEmployeeId: manager.id.toString(),
        ownerId: new UniqueEntityID().toString(),
        content: 'Wrong owner',
      }),
    ).rejects.toBeInstanceOf(ResourceNotFoundError);
  });

  it('should mark complete and uncomplete', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId: manager.id,
      reportId: report.id,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { actionItem } = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: manager.id.toString(),
      ownerId: report.id.toString(),
      content: 'Sample',
    });

    const completed = await updateUseCase.execute({
      tenantId,
      actionItemId: actionItem.id.toString(),
      viewerEmployeeId: report.id.toString(),
      isCompleted: true,
    });

    expect(completed.actionItem.isCompleted).toBe(true);
    expect(completed.actionItem.completedAt).toBeDefined();

    const reverted = await updateUseCase.execute({
      tenantId,
      actionItemId: actionItem.id.toString(),
      viewerEmployeeId: report.id.toString(),
      isCompleted: false,
    });

    expect(reverted.actionItem.isCompleted).toBe(false);
    expect(reverted.actionItem.completedAt).toBeUndefined();
  });

  it('should reject delete from non-participant', async () => {
    const meeting = await meetingsRepository.create({
      tenantId,
      managerId: manager.id,
      reportId: report.id,
      scheduledAt: new Date(),
      durationMinutes: 30,
    });

    const { actionItem } = await addUseCase.execute({
      tenantId,
      meetingId: meeting.id.toString(),
      authorEmployeeId: manager.id.toString(),
      ownerId: report.id.toString(),
      content: 'Sample',
    });

    await expect(
      deleteUseCase.execute({
        tenantId,
        actionItemId: actionItem.id.toString(),
        viewerEmployeeId: new UniqueEntityID().toString(),
      }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
