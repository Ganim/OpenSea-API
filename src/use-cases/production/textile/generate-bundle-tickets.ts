import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { ProductionOrdersRepository } from '@/repositories/production/production-orders-repository';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';

/**
 * Generate Bundle Tickets
 *
 * In garment manufacturing, a "bundle" is a group of cut pieces (typically 10-20)
 * that travel together through the sewing line. Each bundle has a ticket with:
 * - Bundle number (sequential)
 * - Size and color
 * - Quantity of pieces in the bundle
 * - A barcode identifier for tracking
 *
 * This use case generates bundle ticket data from a size-color-quantity matrix.
 * No DB writes — pure calculation.
 */

export interface BundleTicket {
  bundleNumber: number;
  size: string;
  color: string;
  quantity: number;
  barcode: string;
  productionOrderId: string;
  orderNumber: string;
}

export interface BundleTicketsResult {
  productionOrderId: string;
  orderNumber: string;
  bundleSize: number;
  totalBundles: number;
  totalPieces: number;
  bundles: BundleTicket[];
}

interface GenerateBundleTicketsUseCaseRequest {
  tenantId: string;
  productionOrderId: string;
  bundleSize?: number; // pieces per bundle, default 15
  sizes: string[];
  colors: string[];
  quantities: Record<string, Record<string, number>>;
}

interface GenerateBundleTicketsUseCaseResponse {
  result: BundleTicketsResult;
}

export class GenerateBundleTicketsUseCase {
  constructor(
    private productionOrdersRepository: ProductionOrdersRepository,
  ) {}

  async execute({
    tenantId,
    productionOrderId,
    bundleSize = 15,
    sizes,
    colors,
    quantities,
  }: GenerateBundleTicketsUseCaseRequest): Promise<GenerateBundleTicketsUseCaseResponse> {
    // Validate production order exists
    const order = await this.productionOrdersRepository.findById(
      new UniqueEntityID(productionOrderId),
      tenantId,
    );

    if (!order) {
      throw new ResourceNotFoundError('Production order');
    }

    if (bundleSize < 1 || bundleSize > 100) {
      throw new BadRequestError(
        'Bundle size must be between 1 and 100.',
      );
    }

    if (!sizes.length || !colors.length) {
      throw new BadRequestError(
        'At least one size and one color are required.',
      );
    }

    const bundles: BundleTicket[] = [];
    let bundleNumber = 1;
    let totalPieces = 0;

    // Generate bundles for each size-color combination
    for (const size of sizes) {
      for (const color of colors) {
        let remaining = quantities[size]?.[color] ?? 0;

        if (remaining < 0) {
          throw new BadRequestError(
            `Invalid quantity for size ${size}, color ${color}: must be >= 0.`,
          );
        }

        totalPieces += remaining;

        while (remaining > 0) {
          const qty = Math.min(remaining, bundleSize);

          // Barcode format: OP{orderNumber}-B{bundleNumber:04d}
          const barcode = `OP${order.orderNumber}-B${String(bundleNumber).padStart(4, '0')}`;

          bundles.push({
            bundleNumber,
            size,
            color,
            quantity: qty,
            barcode,
            productionOrderId,
            orderNumber: order.orderNumber,
          });

          remaining -= qty;
          bundleNumber++;
        }
      }
    }

    if (totalPieces === 0) {
      throw new BadRequestError(
        'Quantities must contain at least one non-zero value.',
      );
    }

    const result: BundleTicketsResult = {
      productionOrderId,
      orderNumber: order.orderNumber,
      bundleSize,
      totalBundles: bundles.length,
      totalPieces,
      bundles,
    };

    return { result };
  }
}
