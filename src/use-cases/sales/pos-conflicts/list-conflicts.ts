import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConflictDetail } from '@/entities/sales/pos-order-conflict';
import type { PosOrderConflictStatusValue } from '@/entities/sales/value-objects/pos-order-conflict-status';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { PosOrderConflictsRepository } from '@/repositories/sales/pos-order-conflicts-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';

export interface ListConflictsRequest {
  tenantId: string;
  page: number;
  limit: number;
  /** Filter by one or more conflict statuses. When omitted, every status is returned. */
  status?: PosOrderConflictStatusValue[];
  /** Filter by a single terminal. */
  terminalId?: string;
  /** Filter by a single operator. */
  operatorEmployeeId?: string;
}

export interface ListConflictsRow {
  id: string;
  saleLocalUuid: string;
  status: PosOrderConflictStatusValue;
  posTerminalId: string;
  /** Enriched from `PosTerminal.terminalName`. Empty string if the terminal cannot be resolved. */
  terminalName: string;
  posSessionId: string | null;
  posOperatorEmployeeId: string | null;
  /** Enriched from `Employee.fullName`. Empty string when operator is null or unresolvable. */
  operatorName: string;
  /** Enriched from `Employee.shortId`. Empty string when operator is null or unresolvable. */
  operatorShortId: string;
  conflictDetails: ConflictDetail[];
  resolvedByUserId: string | null;
  resolvedAt: Date | null;
  createdAt: Date;
}

export interface ListConflictsResponse {
  data: ListConflictsRow[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

/**
 * Lists POS Order Conflicts for the admin operations panel
 * (`GET /v1/admin/pos/conflicts` — Emporion Plan A Task 30).
 *
 * Behavior:
 *  - Tenant-scoped. Optional filters: `status[]`, `terminalId`,
 *    `operatorEmployeeId`. When no filter is supplied, conflicts from every
 *    status / terminal / operator are returned.
 *  - Result is paginated (default `page=1`, `limit=20`) and ordered by
 *    `createdAt DESC` so the freshest conflicts surface first.
 *  - Each row is hydrated with the terminal's `terminalName` and the
 *    operator's `fullName` + `shortId` via two bulk lookups
 *    (`findManyByIds`) — no per-row queries (no N+1).
 *  - When a terminal or operator cannot be resolved (cross-tenant drift,
 *    soft-deleted, null operator), the corresponding name fields fall back
 *    to empty strings so the listing never breaks.
 *
 * Protected by `sales.pos.admin` permission at the controller level.
 */
export class ListConflictsUseCase {
  constructor(
    private posOrderConflictsRepository: PosOrderConflictsRepository,
    private posTerminalsRepository: PosTerminalsRepository,
    private employeesRepository: EmployeesRepository,
  ) {}

  async execute(request: ListConflictsRequest): Promise<ListConflictsResponse> {
    const { tenantId, page, limit, status, terminalId, operatorEmployeeId } =
      request;

    const paginatedConflicts =
      await this.posOrderConflictsRepository.findManyPaginated({
        tenantId,
        page,
        limit,
        status,
        posTerminalId: terminalId,
        operatorEmployeeId,
      });

    const uniqueTerminalIds = Array.from(
      new Set(
        paginatedConflicts.data.map((conflict) => conflict.posTerminalId),
      ),
    );

    const uniqueOperatorIds = Array.from(
      new Set(
        paginatedConflicts.data
          .map((conflict) => conflict.posOperatorEmployeeId)
          .filter((value): value is string => value !== null),
      ),
    );

    const terminalNameById = new Map<string, string>();
    if (uniqueTerminalIds.length > 0) {
      const terminals = await this.posTerminalsRepository.findManyByIds(
        uniqueTerminalIds.map((id) => new UniqueEntityID(id)),
        tenantId,
      );
      for (const terminal of terminals) {
        terminalNameById.set(terminal.id.toString(), terminal.terminalName);
      }
    }

    const operatorMetaById = new Map<
      string,
      { fullName: string; shortId: string }
    >();
    if (uniqueOperatorIds.length > 0) {
      const operators = await this.employeesRepository.findManyByIds(
        uniqueOperatorIds.map((id) => new UniqueEntityID(id)),
        tenantId,
      );
      for (const operator of operators) {
        operatorMetaById.set(operator.id.toString(), {
          fullName: operator.fullName,
          shortId: operator.shortId ?? '',
        });
      }
    }

    const hydratedRows: ListConflictsRow[] = paginatedConflicts.data.map(
      (conflict) => {
        const operatorMeta = conflict.posOperatorEmployeeId
          ? operatorMetaById.get(conflict.posOperatorEmployeeId)
          : undefined;

        return {
          id: conflict.id.toString(),
          saleLocalUuid: conflict.saleLocalUuid,
          status: conflict.status.value,
          posTerminalId: conflict.posTerminalId,
          terminalName: terminalNameById.get(conflict.posTerminalId) ?? '',
          posSessionId: conflict.posSessionId,
          posOperatorEmployeeId: conflict.posOperatorEmployeeId,
          operatorName: operatorMeta?.fullName ?? '',
          operatorShortId: operatorMeta?.shortId ?? '',
          conflictDetails: conflict.conflictDetails,
          resolvedByUserId: conflict.resolvedByUserId,
          resolvedAt: conflict.resolvedAt,
          createdAt: conflict.createdAt,
        };
      },
    );

    return {
      data: hydratedRows,
      meta: {
        total: paginatedConflicts.total,
        page: paginatedConflicts.page,
        limit: paginatedConflicts.limit,
        pages: paginatedConflicts.totalPages,
      },
    };
  }
}
