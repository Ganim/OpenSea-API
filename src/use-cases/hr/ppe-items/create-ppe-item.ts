import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { PPEItem } from '@/entities/hr/ppe-item';
import type { PPEItemsRepository } from '@/repositories/hr/ppe-items-repository';

export interface CreatePPEItemRequest {
  tenantId: string;
  name: string;
  category: string;
  caNumber?: string;
  manufacturer?: string;
  model?: string;
  expirationMonths?: number;
  minStock?: number;
  currentStock?: number;
  isActive?: boolean;
  notes?: string;
}

export interface CreatePPEItemResponse {
  ppeItem: PPEItem;
}

export class CreatePPEItemUseCase {
  constructor(private ppeItemsRepository: PPEItemsRepository) {}

  async execute(request: CreatePPEItemRequest): Promise<CreatePPEItemResponse> {
    const { tenantId, name, category } = request;

    if (!name || name.trim().length === 0) {
      throw new BadRequestError('O nome do EPI é obrigatório');
    }

    if (!category || category.trim().length === 0) {
      throw new BadRequestError('A categoria do EPI é obrigatória');
    }

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

    if (!validCategories.includes(category)) {
      throw new BadRequestError('Categoria de EPI inválida');
    }

    if (request.expirationMonths !== undefined && request.expirationMonths < 1) {
      throw new BadRequestError(
        'O prazo de validade deve ser de pelo menos 1 mês',
      );
    }

    if (request.minStock !== undefined && request.minStock < 0) {
      throw new BadRequestError('O estoque mínimo não pode ser negativo');
    }

    if (request.currentStock !== undefined && request.currentStock < 0) {
      throw new BadRequestError('O estoque atual não pode ser negativo');
    }

    const ppeItem = await this.ppeItemsRepository.create({
      tenantId,
      name: name.trim(),
      category,
      caNumber: request.caNumber?.trim(),
      manufacturer: request.manufacturer?.trim(),
      model: request.model?.trim(),
      expirationMonths: request.expirationMonths,
      minStock: request.minStock ?? 0,
      currentStock: request.currentStock ?? 0,
      isActive: request.isActive ?? true,
      notes: request.notes?.trim(),
    });

    return { ppeItem };
  }
}
