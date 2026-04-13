import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

/**
 * Generate Cut Plan
 *
 * Given a size-color matrix (sizes x colors x quantities), calculates:
 * - Total pieces to cut
 * - Pieces grouped by size and by color
 * - Estimated fabric consumption per size (using consumption factors)
 * - Total estimated fabric in meters
 * - Number of fabric layers for spreading
 *
 * This is a pure calculation endpoint — no DB writes.
 */

export interface SizeColorMatrix {
  sizes: string[];
  colors: string[];
  quantities: Record<string, Record<string, number>>;
}

export interface CutPlanSizeSummary {
  size: string;
  totalPieces: number;
  estimatedFabricMeters: number;
}

export interface CutPlanColorSummary {
  color: string;
  totalPieces: number;
}

export interface CutPlanResult {
  productionOrderId: string;
  orderNumber: string;
  totalPieces: number;
  piecesPerSize: CutPlanSizeSummary[];
  piecesPerColor: CutPlanColorSummary[];
  totalEstimatedFabricMeters: number;
  wastePercentage: number;
  totalWithWaste: number;
  layersNeeded: number;
  matrix: SizeColorMatrix;
}

interface GenerateCutPlanUseCaseRequest {
  tenantId: string;
  productionOrderId: string;
  matrix: SizeColorMatrix;
  baseFabricConsumptionPerPiece: number; // meters per piece (size M reference)
  wastePercentage?: number; // default 5%
  spreadingTableWidthPieces?: number; // how many pieces fit per layer, default 50
  sizeConsumptionFactors?: Record<string, number>;
}

interface GenerateCutPlanUseCaseResponse {
  cutPlan: CutPlanResult;
}

export class GenerateCutPlanUseCase {
  constructor(private productionOrdersRepository: ProductionOrdersRepository) {}

  async execute({
    tenantId,
    productionOrderId,
    matrix,
    baseFabricConsumptionPerPiece,
    wastePercentage = 5,
    spreadingTableWidthPieces = 50,
    sizeConsumptionFactors,
  }: GenerateCutPlanUseCaseRequest): Promise<GenerateCutPlanUseCaseResponse> {
    // Validate production order exists
    const order = await this.productionOrdersRepository.findById(
      new UniqueEntityID(productionOrderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Production order');
    }

    // Validate matrix
    if (!matrix.sizes.length || !matrix.colors.length) {
      throw new BadRequestError(
        'Matrix must have at least one size and one color.',
      );
    }

    // Default size consumption factors (relative to M = 1.0)
    const factors = sizeConsumptionFactors ?? {
      PP: 0.85,
      P: 0.92,
      M: 1.0,
      G: 1.1,
      GG: 1.22,
      XGG: 1.35,
    };

    // Calculate totals
    let totalPieces = 0;
    const sizeMap = new Map<string, number>();
    const colorMap = new Map<string, number>();

    for (const size of matrix.sizes) {
      for (const color of matrix.colors) {
        const qty = matrix.quantities[size]?.[color] ?? 0;
        if (qty < 0) {
          throw new BadRequestError(
            `Invalid quantity for size ${size}, color ${color}: must be >= 0.`,
          );
        }
        totalPieces += qty;
        sizeMap.set(size, (sizeMap.get(size) ?? 0) + qty);
        colorMap.set(color, (colorMap.get(color) ?? 0) + qty);
      }
    }

    if (totalPieces === 0) {
      throw new BadRequestError(
        'Matrix must contain at least one non-zero quantity.',
      );
    }

    // Calculate fabric consumption per size
    const piecesPerSize: CutPlanSizeSummary[] = matrix.sizes.map((size) => {
      const pieces = sizeMap.get(size) ?? 0;
      const factor = factors[size] ?? 1.0;
      const fabricMeters = pieces * baseFabricConsumptionPerPiece * factor;
      return {
        size,
        totalPieces: pieces,
        estimatedFabricMeters: Math.round(fabricMeters * 100) / 100,
      };
    });

    const piecesPerColor: CutPlanColorSummary[] = matrix.colors.map(
      (color) => ({
        color,
        totalPieces: colorMap.get(color) ?? 0,
      }),
    );

    const totalEstimatedFabricMeters = piecesPerSize.reduce(
      (sum, s) => sum + s.estimatedFabricMeters,
      0,
    );

    const wasteAmount = totalEstimatedFabricMeters * (wastePercentage / 100);
    const totalWithWaste =
      Math.round((totalEstimatedFabricMeters + wasteAmount) * 100) / 100;

    // Layers needed: ceiling of totalPieces / spreading table capacity
    const layersNeeded = Math.ceil(totalPieces / spreadingTableWidthPieces);

    const cutPlan: CutPlanResult = {
      productionOrderId,
      orderNumber: order.orderNumber,
      totalPieces,
      piecesPerSize,
      piecesPerColor,
      totalEstimatedFabricMeters:
        Math.round(totalEstimatedFabricMeters * 100) / 100,
      wastePercentage,
      totalWithWaste,
      layersNeeded,
      matrix,
    };

    return { cutPlan };
  }
}
