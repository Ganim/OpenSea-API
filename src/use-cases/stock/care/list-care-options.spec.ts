import { CareCatalogProvider } from '@/services/care/care-catalog-provider';
import { beforeEach, describe, expect, it } from 'vitest';
import { ListCareOptionsUseCase } from './list-care-options';

let sut: ListCareOptionsUseCase;

describe('ListCareOptionsUseCase', () => {
  beforeEach(() => {
    const provider = CareCatalogProvider.getInstance();
    sut = new ListCareOptionsUseCase(provider);
  });

  it('should return care options grouped by category', async () => {
    const { options } = await sut.execute();
    expect(options).toBeDefined();
    expect(options.WASH).toBeDefined();
    expect(options.BLEACH).toBeDefined();
    expect(options.DRY).toBeDefined();
    expect(options.IRON).toBeDefined();
    expect(options.PROFESSIONAL).toBeDefined();
  });

  it('should return non-empty arrays for each category', async () => {
    const { options } = await sut.execute();
    expect(options.WASH.length).toBeGreaterThan(0);
    expect(options.BLEACH.length).toBeGreaterThan(0);
    expect(options.DRY.length).toBeGreaterThan(0);
    expect(options.IRON.length).toBeGreaterThan(0);
    expect(options.PROFESSIONAL.length).toBeGreaterThan(0);
  });
});
