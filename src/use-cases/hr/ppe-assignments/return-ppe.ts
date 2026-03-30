import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEAssignment } from '@/entities/hr/ppe-assignment';
import type { PPEAssignmentsRepository } from '@/repositories/hr/ppe-assignments-repository';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface ReturnPPERequest {
  tenantId: string;
  assignmentId: string;
  returnCondition: string;
  notes?: string;
}

export interface ReturnPPEResponse {
  assignment: PPEAssignment;
}

export class ReturnPPEUseCase {
  constructor(
    private ppeAssignmentsRepository: PPEAssignmentsRepository,
    private ppeItemsRepository: PPEItemsRepository,
  ) {}

  async execute(request: ReturnPPERequest): Promise<ReturnPPEResponse> {
    const { tenantId, assignmentId, returnCondition } = request;

    const validConditions = ['NEW', 'GOOD', 'WORN', 'DAMAGED'];
    if (!validConditions.includes(returnCondition)) {
      throw new BadRequestError('Condição de devolução inválida');
    }

    const existingAssignment = await this.ppeAssignmentsRepository.findById(
      new UniqueEntityID(assignmentId),
      tenantId,
    );

    if (!existingAssignment) {
      throw new ResourceNotFoundError('Atribuição de EPI não encontrada');
    }

    if (existingAssignment.status !== 'ACTIVE') {
      throw new BadRequestError(
        'Apenas atribuições ativas podem ser devolvidas',
      );
    }

    const assignment = await this.ppeAssignmentsRepository.returnAssignment({
      id: new UniqueEntityID(assignmentId),
      returnCondition,
      notes: request.notes?.trim(),
    });

    if (!assignment) {
      throw new ResourceNotFoundError('Atribuição de EPI não encontrada');
    }

    // Return to stock only if condition is usable (not DAMAGED)
    if (returnCondition !== 'DAMAGED') {
      await this.ppeItemsRepository.adjustStock({
        id: existingAssignment.ppeItemId,
        adjustment: existingAssignment.quantity,
      });
    }

    return { assignment };
  }
}
