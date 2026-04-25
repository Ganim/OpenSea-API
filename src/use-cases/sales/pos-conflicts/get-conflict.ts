import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { ConflictDetail } from '@/entities/sales/pos-order-conflict';
import type { PosOrderConflictStatusValue } from '@/entities/sales/value-objects/pos-order-conflict-status';
import type { EmployeesRepository } from '@/repositories/hr/employees-repository';
import type { OrdersRepository } from '@/repositories/sales/orders-repository';
import type { PosOrderConflictsRepository } from '@/repositories/sales/pos-order-conflicts-repository';
import type { PosTerminalsRepository } from '@/repositories/sales/pos-terminals-repository';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { VariantsRepository } from '@/repositories/stock/variants-repository';

export interface GetConflictRequest {
  tenantId: string;
  conflictId: string;
}

export interface ConflictDetailEnriched extends ConflictDetail {
  variantName: string;
}

export interface ConflictOrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  grandTotal: number;
  currency: string;
  customerId: string | null;
}

export interface GetConflictResponse {
  conflict: {
    id: string;
    saleLocalUuid: string;
    status: PosOrderConflictStatusValue;
    posTerminalId: string;
    terminalName: string;
    posSessionId: string | null;
    posOperatorEmployeeId: string | null;
    operatorName: string;
    operatorShortId: string;
    conflictDetails: ConflictDetailEnriched[];
    resolvedByUserId: string | null;
    resolvedByUserName: string;
    resolvedAt: string | null;
    orderId: string | null;
    order: ConflictOrderSummary | null;
    createdAt: string;
  };
}

/**
 * Returns a single POS Order Conflict enriched with terminal name, operator
 * name + shortId, the resolver user's display name, and per-detail
 * `variantName` (so the resolution UI can render product names instead of
 * UUIDs). When the conflict was resolved with `FORCE_ADJUSTMENT` /
 * `SUBSTITUTE_ITEM` and an Order was created, the order summary is included
 * inline so the panel can deep-link.
 *
 * Used by the RP `ConflictDetailsPanel` (Plan B F-01). Protected by
 * `sales.pos.admin` permission at the controller level.
 */
export class GetConflictUseCase {
  constructor(
    private posOrderConflictsRepository: PosOrderConflictsRepository,
    private posTerminalsRepository: PosTerminalsRepository,
    private employeesRepository: EmployeesRepository,
    private usersRepository: UsersRepository,
    private variantsRepository: VariantsRepository,
    private ordersRepository: OrdersRepository,
  ) {}

  async execute(request: GetConflictRequest): Promise<GetConflictResponse> {
    const { tenantId, conflictId } = request;

    const conflict = await this.posOrderConflictsRepository.findById(
      new UniqueEntityID(conflictId),
      tenantId,
    );

    if (!conflict) {
      throw new ResourceNotFoundError('Conflict not found.');
    }

    const terminal = await this.posTerminalsRepository.findById(
      new UniqueEntityID(conflict.posTerminalId),
      tenantId,
    );
    const terminalName = terminal?.terminalName ?? '';

    let operatorName = '';
    let operatorShortId = '';
    if (conflict.posOperatorEmployeeId) {
      const employees = await this.employeesRepository.findManyByIds(
        [new UniqueEntityID(conflict.posOperatorEmployeeId)],
        tenantId,
      );
      const operator = employees[0];
      if (operator) {
        operatorName = operator.fullName;
        operatorShortId = operator.shortId ?? '';
      }
    }

    let resolvedByUserName = '';
    if (conflict.resolvedByUserId) {
      const users = await this.usersRepository.findManyByIds([
        new UniqueEntityID(conflict.resolvedByUserId),
      ]);
      const resolver = users[0];
      if (resolver) {
        const profileName = resolver.profile?.name?.trim();
        const profileSurname = resolver.profile?.surname?.trim();
        const fullProfile = [profileName, profileSurname]
          .filter((part): part is string => Boolean(part && part.length > 0))
          .join(' ');
        resolvedByUserName =
          fullProfile.length > 0
            ? fullProfile
            : (resolver.username?.value ?? resolver.email?.value ?? '');
      }
    }

    const uniqueVariantIds = Array.from(
      new Set(conflict.conflictDetails.map((d) => d.variantId)),
    );

    const variantNameById = new Map<string, string>();
    if (uniqueVariantIds.length > 0) {
      const variants = await this.variantsRepository.findManyByIds(
        uniqueVariantIds.map((id) => new UniqueEntityID(id)),
        tenantId,
      );
      for (const variant of variants) {
        variantNameById.set(variant.id.toString(), variant.name);
      }
    }

    const enrichedDetails: ConflictDetailEnriched[] =
      conflict.conflictDetails.map((detail) => ({
        ...detail,
        variantName: variantNameById.get(detail.variantId) ?? '',
      }));

    let orderSummary: ConflictOrderSummary | null = null;
    if (conflict.orderId) {
      const order = await this.ordersRepository.findById(
        new UniqueEntityID(conflict.orderId),
        tenantId,
      );
      if (order) {
        orderSummary = {
          id: order.id.toString(),
          orderNumber: order.orderNumber,
          status: order.status,
          grandTotal: order.grandTotal,
          currency: order.currency,
          customerId: order.customerId?.toString() ?? null,
        };
      }
    }

    return {
      conflict: {
        id: conflict.id.toString(),
        saleLocalUuid: conflict.saleLocalUuid,
        status: conflict.status.value,
        posTerminalId: conflict.posTerminalId,
        terminalName,
        posSessionId: conflict.posSessionId,
        posOperatorEmployeeId: conflict.posOperatorEmployeeId,
        operatorName,
        operatorShortId,
        conflictDetails: enrichedDetails,
        resolvedByUserId: conflict.resolvedByUserId,
        resolvedByUserName,
        resolvedAt: conflict.resolvedAt?.toISOString() ?? null,
        orderId: conflict.orderId,
        order: orderSummary,
        createdAt: conflict.createdAt.toISOString(),
      },
    };
  }
}
