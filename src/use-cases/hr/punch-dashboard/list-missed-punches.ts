/**
 * ListMissedPunchesUseCase — Phase 07 / Plan 07-05b (Wave 3).
 *
 * Listagem paginada de PunchMissedLog para o dashboard do gestor. Usa o
 * `PunchMissedLogRepository.findManyByTenant` (criado em Plan 07-03) e
 * resolve display context (employeeName + departmentName) via Employee
 * lookup batch — mapper LGPD-safe (sem CPF) garante que apenas
 * `employeeName` + `departmentName` chegam ao DTO público.
 *
 * Scope hierárquico: `scopedEmployeeIds` quando provido restringe a
 * listagem aos employees gerenciados (BFS recursivo + delegations
 * resolvidos no controller).
 */

import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import {
  punchMissedLogToDTO,
  type PunchMissedLogDTO,
} from '@/mappers/hr/punch-missed-log/punch-missed-log-to-dto';
import type { PunchMissedLogRepository } from '@/repositories/hr/punch-missed-log-repository';

export interface ListMissedPunchesInput {
  tenantId: string;
  /** Filter day (UTC start-of-day). Use case aceita qualquer hora — repo normaliza. */
  date?: Date;
  scopedEmployeeIds?: string[];
  page?: number;
  pageSize?: number;
}

export interface ListMissedPunchesResponse {
  items: PunchMissedLogDTO[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Shape mínimo Prisma necessário para resolver employeeName/departmentName
 * sem importar o PrismaClient real (consistência com Plan 07-05a pattern).
 */
export interface ListMissedPunchesPrisma {
  employee: {
    findMany(args: {
      where: { tenantId: string; id: { in: string[] } };
      select: {
        id: true;
        fullName: true;
        socialName: true;
        department: { select: { name: true } };
      };
    }): Promise<
      Array<{
        id: string;
        fullName: string;
        socialName: string | null;
        department: { name: string } | null;
      }>
    >;
  };
}

export class ListMissedPunchesUseCase {
  constructor(
    private repo: PunchMissedLogRepository,
    private prisma: ListMissedPunchesPrisma,
  ) {}

  async execute(
    input: ListMissedPunchesInput,
  ): Promise<ListMissedPunchesResponse> {
    const page = input.page ?? 1;
    const pageSize = input.pageSize ?? 20;

    const { items, total } = await this.repo.findManyByTenant(input.tenantId, {
      ...(input.date ? { dateStart: input.date, dateEnd: input.date } : {}),
      ...(input.scopedEmployeeIds && input.scopedEmployeeIds.length > 0
        ? { employeeIds: input.scopedEmployeeIds }
        : {}),
      page,
      pageSize,
    });

    if (items.length === 0) {
      return { items: [], total, page, pageSize };
    }

    // Resolve display context (employeeName + departmentName) for the page.
    const employeeIds = Array.from(
      new Set(items.map((it) => it.employeeId.toString())),
    );
    const employees = await this.prisma.employee.findMany({
      where: { tenantId: input.tenantId, id: { in: employeeIds } },
      select: {
        id: true,
        fullName: true,
        socialName: true,
        department: { select: { name: true } },
      },
    });
    const empById = new Map(employees.map((e) => [e.id, e]));

    const dtos = items.map((entity) => {
      const empId = entity.employeeId.toString();
      const emp = empById.get(empId);
      return punchMissedLogToDTO(entity, {
        employeeName: emp?.socialName ?? emp?.fullName ?? '—',
        departmentName: emp?.department?.name ?? null,
      });
    });

    // Reference exported import so unused-symbol lint stays clean if mapper
    // changes signature later.
    void UniqueEntityID;

    return { items: dtos, total, page, pageSize };
  }
}
