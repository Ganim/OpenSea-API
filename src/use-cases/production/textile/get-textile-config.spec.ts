import { describe, it, expect } from 'vitest';
import { GetTextileConfigUseCase } from './get-textile-config';

describe('GetTextileConfigUseCase', () => {
  it('should return default textile configuration', async () => {
    const useCase = new GetTextileConfigUseCase();

    const { config } = await useCase.execute({ tenantId: 'tenant-1' });

    expect(config.industryType).toBe('TEXTILE');
    expect(config.enableSizeColorMatrix).toBe(true);
    expect(config.enableBundleTracking).toBe(true);
    expect(config.enableCutOrders).toBe(true);
    expect(config.enablePersonalization).toBe(false);
    expect(config.defaultSizes).toEqual(['PP', 'P', 'M', 'G', 'GG', 'XGG']);
    expect(config.defaultBundleSize).toBe(15);
    expect(config.fabricConsumptionUnit).toBe('METERS');
    expect(config.defaultFabricWastePercentage).toBe(5);
  });

  it('should return size consumption factors for all default sizes', async () => {
    const useCase = new GetTextileConfigUseCase();

    const { config } = await useCase.execute({ tenantId: 'tenant-1' });

    expect(config.sizeConsumptionFactors).toHaveProperty('PP');
    expect(config.sizeConsumptionFactors).toHaveProperty('P');
    expect(config.sizeConsumptionFactors).toHaveProperty('M');
    expect(config.sizeConsumptionFactors).toHaveProperty('G');
    expect(config.sizeConsumptionFactors).toHaveProperty('GG');
    expect(config.sizeConsumptionFactors).toHaveProperty('XGG');
    // M should be the reference (1.0)
    expect(config.sizeConsumptionFactors['M']).toBe(1.0);
    // Smaller sizes should consume less
    expect(config.sizeConsumptionFactors['PP']).toBeLessThan(1.0);
    // Larger sizes should consume more
    expect(config.sizeConsumptionFactors['XGG']).toBeGreaterThan(1.0);
  });
});
