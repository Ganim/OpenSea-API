/**
 * Get Textile Configuration
 *
 * Returns the default textile/garment production configuration.
 * Future: will read from a tenant-level ProductionConfig table.
 * For now, returns hardcoded defaults suitable for garment manufacturing.
 */

export interface TextileConfig {
  industryType: 'TEXTILE';
  enableSizeColorMatrix: boolean;
  enableBundleTracking: boolean;
  enableCutOrders: boolean;
  enablePersonalization: boolean;
  defaultSizes: string[];
  defaultBundleSize: number;
  fabricConsumptionUnit: 'METERS' | 'YARDS';
  defaultFabricWastePercentage: number;
  sizeConsumptionFactors: Record<string, number>;
}

interface GetTextileConfigUseCaseRequest {
  tenantId: string;
}

interface GetTextileConfigUseCaseResponse {
  config: TextileConfig;
}

export class GetTextileConfigUseCase {
  async execute(
    _request: GetTextileConfigUseCaseRequest,
  ): Promise<GetTextileConfigUseCaseResponse> {
    // Future: fetch from DB per tenant
    // For now, return sensible defaults for garment manufacturing
    const config: TextileConfig = {
      industryType: 'TEXTILE',
      enableSizeColorMatrix: true,
      enableBundleTracking: true,
      enableCutOrders: true,
      enablePersonalization: false,
      defaultSizes: ['PP', 'P', 'M', 'G', 'GG', 'XGG'],
      defaultBundleSize: 15,
      fabricConsumptionUnit: 'METERS',
      defaultFabricWastePercentage: 5,
      // Base fabric consumption in meters per size (for a standard garment)
      // These are multipliers relative to size M (1.0)
      sizeConsumptionFactors: {
        PP: 0.85,
        P: 0.92,
        M: 1.0,
        G: 1.1,
        GG: 1.22,
        XGG: 1.35,
      },
    };

    return { config };
  }
}
