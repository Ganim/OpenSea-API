import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type { PPEItem } from '@/entities/hr/ppe-item';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface UpdatePPEItemRequest {
  tenantId: string;
  ppeItemId: string;
  name?: string;
  category?: string;
  caNumber?: string | null;
  manufacturer?: string | null;
  model?: string | null;
  expirationMonths?: number | null;
  minStock?: number;
  isActive?: boolean;
  notes?: string | null;
}

export interface UpdatePPEItemResponse {
  ppeItem: PPEItem;
}

export class UpdatePPEItemUseCase {
  constructor(private ppeItemsRepository: PPEItemsRepository) {}

  async execute(request: UpdatePPEItemRequest): Promise<UpdatePPEItemResponse> {
    const { tenantId, ppeItemId, ...updateData } = request;

    const existingItem = await this.ppeItemsRepository.findById(
      new UniqueEntityID(ppeItemId),
      tenantId,
    );

    if (!existingItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    if (updateData.name !== undefined && updateData.name.trim().length === 0) {
      throw new BadRequestError('O nome do EPI é obrigatório');
    }

    if (updateData.category !== undefined) {
      const validCategories = [
        'HEAD',
        'EYES',
        'EARS',
        'RESPIRATORY',
        'HANDS',
        'FEET',
        'BODY',
        'FALL_PROTECTION',
      ];
      if (!validCategories.includes(updateData.category)) {
        throw new BadRequestError('Categoria de EPI inválida');
      }
    }

    if (
      updateData.expirationMonths !== undefined &&
      updateData.expirationMonths !== null &&
      updateData.expirationMonths < 1
    ) {
      throw new BadRequestError(
        'O prazo de validade deve ser de pelo menos 1 mês',
      );
    }

    if (updateData.minStock !== undefined && updateData.minStock < 0) {
      throw new BadRequestError('O estoque mínimo não pode ser negativo');
    }

    const ppeItem = await this.ppeItemsRepository.update({
      id: new UniqueEntityID(ppeItemId),
      name: updateData.name?.trim(),
      category: updateData.category,
      caNumber: updateData.caNumber,
      manufacturer: updateData.manufacturer,
      model: updateData.model,
      expirationMonths: updateData.expirationMonths,
      minStock: updateData.minStock,
      isActive: updateData.isActive,
      notes: updateData.notes,
    });

    if (!ppeItem) {
      throw new ResourceNotFoundError('EPI não encontrado');
    }

    return { ppeItem };
  }
}
