import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { CompanyAnnouncement } from '@/entities/hr/company-announcement';
import type { Employee } from '@/entities/hr/employee';
import type { TeamMembersRepository } from '@/repositories/core/team-members-repository';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';

export interface ResolveAudienceInput {
  tenantId: string;
  announcement: CompanyAnnouncement;
}

export interface ResolveAudienceOutput {
  /**
   * Distinct list of employees that match at least one of the announcement
   * audience dimensions (departments, teams, roles, employees). When no
   * dimension is configured, returns every active employee in the tenant.
   */
  employees: Employee[];
}

/**
 * Resolves the concrete set of employees that should see (and be notified
 * about) a given {@link CompanyAnnouncement}.
 *
 * Audience semantics — UNION of every configured dimension, deduplicated by
 * employee id:
 *  - `departments` → every active employee whose `departmentId` matches
 *  - `teams`       → every active employee whose linked `userId` is an active
 *                    member of any of the supplied teams
 *  - `roles`       → every active employee whose `positionId` matches
 *  - `employees`   → the explicitly listed employee ids (still scoped by tenant)
 *
 * If NONE of the dimensions are configured, the audience is every active
 * employee of the tenant — i.e. the announcement is "broadcast to all".
 */
export class ResolveAudienceUseCase {
  constructor(
    private readonly employeesRepository: EmployeesRepository,
    private readonly teamMembersRepository: TeamMembersRepository,
  ) {}

  async execute(input: ResolveAudienceInput): Promise<ResolveAudienceOutput> {
    const { tenantId, announcement } = input;
    const targets = announcement.audienceTargets;

    // No audience dimension set → broadcast to every active employee.
    if (announcement.isTargetedToAll()) {
      const activeEmployees =
        await this.employeesRepository.findManyActive(tenantId);
      return { employees: activeEmployees };
    }

    const employeesById = new Map<string, Employee>();

    // Departments dimension
    for (const departmentId of targets.departments ?? []) {
      const employeesInDepartment =
        await this.employeesRepository.findManyByDepartment(
          new UniqueEntityID(departmentId),
          tenantId,
        );
      for (const employee of employeesInDepartment) {
        if (employee.status.value !== 'ACTIVE') continue;
        employeesById.set(employee.id.toString(), employee);
      }
    }

    // Roles (positions) dimension
    for (const positionId of targets.roles ?? []) {
      const employeesInPosition =
        await this.employeesRepository.findManyByPosition(
          new UniqueEntityID(positionId),
          tenantId,
        );
      for (const employee of employeesInPosition) {
        if (employee.status.value !== 'ACTIVE') continue;
        employeesById.set(employee.id.toString(), employee);
      }
    }

    // Teams dimension — Team membership is by userId; map back to Employee.
    for (const teamId of targets.teams ?? []) {
      const teamMembersResult = await this.teamMembersRepository.findMany({
        teamId: new UniqueEntityID(teamId),
        limit: Number.MAX_SAFE_INTEGER,
      });
      for (const teamMember of teamMembersResult.members) {
        const employee = await this.employeesRepository.findByUserId(
          teamMember.userId,
          tenantId,
        );
        if (!employee) continue;
        if (employee.status.value !== 'ACTIVE') continue;
        employeesById.set(employee.id.toString(), employee);
      }
    }

    // Employees dimension — explicit ids
    for (const employeeId of targets.employees ?? []) {
      const employee = await this.employeesRepository.findById(
        new UniqueEntityID(employeeId),
        tenantId,
      );
      if (!employee) continue;
      if (employee.status.value !== 'ACTIVE') continue;
      employeesById.set(employee.id.toString(), employee);
    }

    return { employees: Array.from(employeesById.values()) };
  }
}
