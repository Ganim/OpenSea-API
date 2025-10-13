import { describe, it, expect, beforeEach } from 'vitest';
import { CreateLocationUseCase } from './create-location';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

let locationsRepository: InMemoryLocationsRepository;
let sut: CreateLocationUseCase;

describe('CreateLocationUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    sut = new CreateLocationUseCase(locationsRepository);
  });

  it('should create a location', async () => {
    const result = await sut.execute({
      code: 'WH-001',
      description: 'Main Warehouse',
      locationType: 'WAREHOUSE',
      capacity: 1000,
    });

    expect(result.location).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        code: 'WH-001',
        description: 'Main Warehouse',
        locationType: 'WAREHOUSE',
        capacity: 1000,
        currentOccupancy: 0,
        isActive: true,
      }),
    );
  });

  it('should create a location without optional fields', async () => {
    const result = await sut.execute({
      code: 'ZONE-001',
    });

    expect(result.location.code).toBe('ZONE-001');
    expect(result.location.description).toBeUndefined();
    expect(result.location.locationType).toBeUndefined();
  });

  it('should create a location with parent', async () => {
    const parent = await sut.execute({
      code: 'WH-001',
      locationType: 'WAREHOUSE',
    });

    const result = await sut.execute({
      code: 'ZONE-A',
      locationType: 'ZONE',
      parentId: parent.location.id,
    });

    expect(result.location.parentId).toBe(parent.location.id);
  });

  it('should not create a location with empty code', async () => {
    await expect(
      sut.execute({
        code: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with code longer than 50 characters', async () => {
    await expect(
      sut.execute({
        code: 'a'.repeat(51),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with duplicate code', async () => {
    await sut.execute({
      code: 'WH-001',
    });

    await expect(
      sut.execute({
        code: 'WH-001',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with invalid type', async () => {
    await expect(
      sut.execute({
        code: 'WH-001',
        locationType: 'INVALID',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with negative capacity', async () => {
    await expect(
      sut.execute({
        code: 'WH-001',
        capacity: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with negative occupancy', async () => {
    await expect(
      sut.execute({
        code: 'WH-001',
        currentOccupancy: -5,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with occupancy exceeding capacity', async () => {
    await expect(
      sut.execute({
        code: 'WH-001',
        capacity: 100,
        currentOccupancy: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with non-existent parent', async () => {
    await expect(
      sut.execute({
        code: 'ZONE-A',
        parentId: 'non-existent-id',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
