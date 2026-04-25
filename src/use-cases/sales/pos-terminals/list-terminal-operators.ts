import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosTerminalOperatorsRepository } from '@/repositories/sales/pos-terminal-operators-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

export type ListTerminalOperatorsActivityFilter = 'active' | 'all';

export interface ListTerminalOperatorsRequest {
  tenantId: string;
  terminalId: string;
  page: number;
  limit: number;
  /** `'active'` (default) returns only operators with `isActive=true`; `'all'` returns both active and revoked rows. */
  isActive?: ListTerminalOperatorsActivityFilter;
}

export interface ListTerminalOperatorRow {
  operatorId: string;
  employeeId: string;
  employeeName: string;
  employeeShortId: string;
  assignedAt: Date;
  assignedByUserId: string;
  isActive: boolean;
  revokedAt: Date | null;
}

export interface ListTerminalOperatorsResponse {
  data: ListTerminalOperatorRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Lists the Employees linked as operators of a specific POS Terminal.
 *
 * Behavior:
 *  - 404 when the terminal does not exist within the tenant.
 *  - Default filter: only currently-active links (`isActive='active'`). Pass
 *    `isActive='all'` to include revoked rows for audit / history views.
 *  - Result is paginated (default page=1, limit=20) and ordered by
 *    `assignedAt DESC` so the most-recent assignments appear first.
 *  - Each row is hydrated with the Employee's `fullName` and `shortId` via a
 *    single bulk lookup (`findManyByIds`) to avoid N+1. When an employee row
 *    cannot be found (soft-deleted / cross-tenant drift), the name and short
 *    ID fall back to empty strings so the listing never breaks.
 *
 * Used by the Emporion POS admin panel (`/sales/pos/terminals/:id/operators`).
 * Protected by `sales.pos.admin` permission.
 */
export class ListTerminalOperatorsUseCase {
  constructor(
    private posTerminalsRepository: PosTerminalsRepository,
    private operatorsRepository: PosTerminalOperatorsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(
    request: ListTerminalOperatorsRequest,
  ): Promise<ListTerminalOperatorsResponse> {
    const { tenantId, terminalId, page, limit, isActive = 'active' } = request;

    const terminalUniqueId = new UniqueEntityID(terminalId);

    const terminal = await this.posTerminalsRepository.findById(
      terminalUniqueId,
      tenantId,
    );

    if (!terminal) {
      throw new ResourceNotFoundError('POS terminal not found');
    }

    const paginatedOperators =
      await this.operatorsRepository.findManyByTerminalIdPaginated({
        terminalId,
        tenantId,
        page,
        limit,
        includeRevoked: isActive === 'all',
      });

    const employeeIdsToHydrate = paginatedOperators.data.map(
      (operator) => operator.employeeId,
    );

    const employeesById = new Map<
      string,
      { fullName: string; shortId: string | null | undefined }
    >();

    if (employeeIdsToHydrate.length > 0) {
      const employees = await this.employeesRepository.findManyByIds(
        employeeIdsToHydrate,
        tenantId,
      );
      for (const employee of employees) {
        employeesById.set(employee.id.toString(), {
          fullName: employee.fullName,
          shortId: employee.shortId,
        });
      }
    }

    const hydratedRows: ListTerminalOperatorRow[] = paginatedOperators.data.map(
      (operator) => {
        const employeeMeta = employeesById.get(operator.employeeId.toString());
        return {
          operatorId: operator.id.toString(),
          employeeId: operator.employeeId.toString(),
          employeeName: employeeMeta?.fullName ?? '',
          employeeShortId: employeeMeta?.shortId ?? '',
          assignedAt: operator.assignedAt,
          assignedByUserId: operator.assignedByUserId.toString(),
          isActive: operator.isActive,
          revokedAt: operator.revokedAt,
        };
      },
    );

    return {
      data: hydratedRows,
      meta: {
        total: paginatedOperators.total,
        page: paginatedOperators.page,
        limit: paginatedOperators.limit,
        pages: paginatedOperators.totalPages,
      },
    };
  }
}
