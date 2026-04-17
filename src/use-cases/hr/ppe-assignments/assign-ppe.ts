import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEAssignment } from '@/entities/hr/ppe-assignment';
import type { TransactionManager } from '@/lib/transaction-manager';
import type { PPEAssignmentsRepository } from '@/repositories/hr/ppe-assignments-repository';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface AssignPPERequest {
  tenantId: string;
  ppeItemId: string;
  employeeId: string;
  expiresAt?: Date;
  condition?: string;
  quantity: number;
  notes?: string;
}

export interface AssignPPEResponse {
  assignment: PPEAssignment;
}

export class AssignPPEUseCase {
  constructor(
    private ppeAssignmentsRepository: PPEAssignmentsRepository,
    private ppeItemsRepository: PPEItemsRepository,
    /**
     * Optional so unit tests with in-memory repos can skip transaction
     * plumbing (in-memory impls are trivially atomic under the single
     * event-loop thread). Production callers must pass the Prisma manager.
     */
    private transactionManager?: TransactionManager,
  ) {}

  async execute(request: AssignPPERequest): Promise<AssignPPEResponse> {
    const { tenantId, ppeItemId, employeeId, quantity } = request;

    if (quantity < 1) {
      throw new BadRequestError('A quantidade deve ser pelo menos 1');
    }

    const ppeItem = await this.ppeItemsRepository.findById(
      new UniqueEntityID(ppeItemId),
      tenantId,
    );

    if (!ppeItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    if (!ppeItem.isActive) {
      throw new BadRequestError(
        'Este EPI está inativo e não pode ser atribuído',
      );
    }

    // Calculate expiration based on item's expirationMonths
    let expiresAt = request.expiresAt;
    if (!expiresAt && ppeItem.expirationMonths) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + ppeItem.expirationMonths);
    }

    const trimmedNotes = request.notes?.trim();
    const condition = request.condition ?? 'NEW';

    // P0 safety — replace the previous "find, validate, decrement" flow with
    // an atomic compare-and-decrement (Postgres `UPDATE ... WHERE
    // current_stock >= $qty`). Two concurrent assigns against the last unit
    // used to both succeed; now only the first decrement lands and the
    // other raises a 422 BadRequest. Wrapped in a transaction so if the
    // assignment-create fails (FK violation, DB hiccup) the stock decrement
    // rolls back and inventory stays consistent.
    const runAssign = async (
      tx?: Parameters<Parameters<TransactionManager['run']>[0]>[0],
    ): Promise<PPEAssignment> => {
      const decrementResult = await this.ppeItemsRepository.atomicDecrementStock(
        new UniqueEntityID(ppeItemId),
        quantity,
        tenantId,
        tx,
      );

      if (decrementResult.count === 0) {
        // Either the row was deleted between the findById above and this
        // update, another concurrent assign took the stock, or the tenant
        // guard rejected a cross-tenant write. In every case "estoque
        // insuficiente" is the safe user-visible answer.
        throw new BadRequestError(
          `Estoque insuficiente. Disponível: ${ppeItem.currentStock}, Solicitado: ${quantity}`,
        );
      }

      return this.ppeAssignmentsRepository.create(
        {
          tenantId,
          ppeItemId,
          employeeId,
          expiresAt,
          condition,
          quantity,
          notes: trimmedNotes,
        },
        tx,
      );
    };

    const assignment = this.transactionManager
      ? await this.transactionManager.run((tx) => runAssign(tx))
      : await runAssign();

    return { assignment };
  }
}
