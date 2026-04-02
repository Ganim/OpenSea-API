import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEAssignment } from '@/entities/hr/ppe-assignment';
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

    if (ppeItem.currentStock < quantity) {
      throw new BadRequestError(
        `Estoque insuficiente. Disponível: ${ppeItem.currentStock}, Solicitado: ${quantity}`,
      );
    }

    // Calculate expiration based on item's expirationMonths
    let expiresAt = request.expiresAt;
    if (!expiresAt && ppeItem.expirationMonths) {
      expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + ppeItem.expirationMonths);
    }

    const assignment = await this.ppeAssignmentsRepository.create({
      tenantId,
      ppeItemId,
      employeeId,
      expiresAt,
      condition: request.condition ?? 'NEW',
      quantity,
      notes: request.notes?.trim(),
    });

    // Deduct from stock
    await this.ppeItemsRepository.adjustStock({
      id: new UniqueEntityID(ppeItemId),
      adjustment: -quantity,
    });

    return { assignment };
  }
}
