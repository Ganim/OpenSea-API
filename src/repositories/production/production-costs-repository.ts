import type { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import type {
  ProductionCost,
  ProductionCostType,
} from '@/entities/production/production-cost';

export interface CreateProductionCostSchema {
  productionOrderId: string;
  costType: ProductionCostType;
  description?: string;
  plannedAmount: number;
  actualAmount: number;
  varianceAmount: number;
}

export interface UpdateProductionCostSchema {
  id: UniqueEntityID;
  costType?: ProductionCostType;
  description?: string | null;
  plannedAmount?: number;
  actualAmount?: number;
  varianceAmount?: number;
}

export interface ProductionCostSummary {
  totalPlanned: number;
  totalActual: number;
  totalVariance: number;
  details: ProductionCost[];
}

export interface ProductionCostsRepository {
  create(data: CreateProductionCostSchema): Promise<ProductionCost>;
  findById(id: UniqueEntityID): Promise<ProductionCost | null>;
  findManyByOrderId(productionOrderId: string): Promise<ProductionCost[]>;
  update(data: UpdateProductionCostSchema): Promise<ProductionCost | null>;
  delete(id: UniqueEntityID): Promise<void>;
}
