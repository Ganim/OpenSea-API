import { TeamMember } from '@/entities/core/team-member';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  CompanyAnnouncement,
  type AnnouncementAudienceTargets,
} from '@/entities/hr/company-announcement';
import type { Employee } from '@/entities/hr/employee';
import { EmployeeStatus } from '@/entities/hr/value-objects';
import { InMemoryTeamMembersRepository } from '@/repositories/core/in-memory/in-memory-team-members-repository';
import { InMemoryEmployeesRepository } from '@/repositories/hr/in-memory/in-memory-employees-repository';
import { makeEmployee } from '@/utils/tests/factories/hr/make-employee';
import { beforeEach, describe, expect, it } from 'vitest';
import { ResolveAudienceUseCase } from './resolve-audience';

let employeesRepository: InMemoryEmployeesRepository;
let teamMembersRepository: InMemoryTeamMembersRepository;
let sut: ResolveAudienceUseCase;

const tenantId = new UniqueEntityID();
const tenantIdString = tenantId.toString();

function buildAnnouncement(
  targets: string[] | AnnouncementAudienceTargets | undefined,
): CompanyAnnouncement {
  return CompanyAnnouncement.create({
    tenantId,
    title: 'Audience test',
    content: 'Content',
    priority: 'NORMAL',
    isActive: true,
    targetDepartmentIds: targets,
  });
}

async function persistEmployee(
  options: {
    departmentId?: UniqueEntityID;
    positionId?: UniqueEntityID;
    userId?: UniqueEntityID;
    status?: EmployeeStatus;
  } = {},
): Promise<Employee> {
  const blueprint = makeEmployee({
    tenantId,
    status: options.status ?? EmployeeStatus.ACTIVE(),
    departmentId: options.departmentId,
    positionId: options.positionId,
    userId: options.userId,
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
    departmentId: options.departmentId,
    positionId: options.positionId,
  });
}

describe('Resolve Announcement Audience Use Case', () => {
  beforeEach(() => {
    employeesRepository = new InMemoryEmployeesRepository();
    teamMembersRepository = new InMemoryTeamMembersRepository();
    sut = new ResolveAudienceUseCase(
      employeesRepository,
      teamMembersRepository,
    );
  });

  it('returns every active employee when no audience dimension is set', async () => {
    await persistEmployee();
    await persistEmployee();
    await persistEmployee({ status: EmployeeStatus.TERMINATED() });

    const announcement = buildAnnouncement(undefined);

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(2);
  });

  it('resolves employees by departments dimension only', async () => {
    const departmentA = new UniqueEntityID();
    const departmentB = new UniqueEntityID();

    await persistEmployee({ departmentId: departmentA });
    await persistEmployee({ departmentId: departmentA });
    await persistEmployee({ departmentId: departmentB });

    const announcement = buildAnnouncement({
      departments: [departmentA.toString()],
    });

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(2);
    expect(
      employees.every((employee) =>
        employee.departmentId?.equals(departmentA),
      ),
    ).toBe(true);
  });

  it('resolves employees by roles (positions) dimension only', async () => {
    const seniorRole = new UniqueEntityID();
    const juniorRole = new UniqueEntityID();

    await persistEmployee({ positionId: seniorRole });
    await persistEmployee({ positionId: juniorRole });

    const announcement = buildAnnouncement({
      roles: [seniorRole.toString()],
    });

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(1);
    expect(employees[0].positionId?.equals(seniorRole)).toBe(true);
  });

  it('resolves employees by teams dimension via TeamMember linkage', async () => {
    const teamId = new UniqueEntityID();
    const userId = new UniqueEntityID();

    const employee = await persistEmployee({ userId });
    await persistEmployee(); // not in team

    teamMembersRepository.items.push(
      TeamMember.create({
        tenantId,
        teamId,
        userId,
        role: 'MEMBER',
      }),
    );

    const announcement = buildAnnouncement({ teams: [teamId.toString()] });

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(1);
    expect(employees[0].id.equals(employee.id)).toBe(true);
  });

  it('resolves employees by direct employees dimension', async () => {
    const targetEmployee = await persistEmployee();
    await persistEmployee();

    const announcement = buildAnnouncement({
      employees: [targetEmployee.id.toString()],
    });

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(1);
    expect(employees[0].id.equals(targetEmployee.id)).toBe(true);
  });

  it('returns the deduplicated UNION when multiple dimensions overlap', async () => {
    const departmentA = new UniqueEntityID();
    const role = new UniqueEntityID();

    const overlappingEmployee = await persistEmployee({
      departmentId: departmentA,
      positionId: role,
    });
    await persistEmployee({ departmentId: departmentA });
    await persistEmployee({ positionId: role });
    await persistEmployee(); // unrelated

    const announcement = buildAnnouncement({
      departments: [departmentA.toString()],
      roles: [role.toString()],
    });

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(3);
    const overlappingMatches = employees.filter((employee) =>
      employee.id.equals(overlappingEmployee.id),
    );
    expect(overlappingMatches).toHaveLength(1);
  });

  it('treats legacy string[] payload as departments dimension', async () => {
    const departmentA = new UniqueEntityID();
    await persistEmployee({ departmentId: departmentA });
    await persistEmployee();

    const announcement = buildAnnouncement([departmentA.toString()]);

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(1);
    expect(employees[0].departmentId?.equals(departmentA)).toBe(true);
  });

  it('skips inactive employees even when explicitly listed', async () => {
    const targetEmployee = await persistEmployee({
      status: EmployeeStatus.TERMINATED(),
    });

    const announcement = buildAnnouncement({
      employees: [targetEmployee.id.toString()],
    });

    const { employees } = await sut.execute({
      tenantId: tenantIdString,
      announcement,
    });

    expect(employees).toHaveLength(0);
  });
});
