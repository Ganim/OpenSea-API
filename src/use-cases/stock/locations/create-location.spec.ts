import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryLocationsRepository } from '@/repositories/stock/in-memory/in-memory-locations-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateLocationUseCase } from './create-location';

let locationsRepository: InMemoryLocationsRepository;
let sut: CreateLocationUseCase;

describe('CreateLocationUseCase', () => {
  beforeEach(() => {
    locationsRepository = new InMemoryLocationsRepository();
    sut = new CreateLocationUseCase(locationsRepository);
  });

  it('should create a location', async () => {
    const result = await sut.execute({
      code: 'WH001',
      titulo: 'Main Warehouse',
      type: 'WAREHOUSE',
      capacity: 1000,
    });

    expect(result.location.id).toBeDefined();
    expect(result.location.code).toBe('WH001');
    expect(result.location.titulo).toBe('Main Warehouse');
    expect(result.location.type?.value).toBe('WAREHOUSE');
    expect(result.location.capacity).toBe(1000);
    expect(result.location.currentOccupancy).toBe(0);
    expect(result.location.isActive).toBe(true);
  });

  it('should create a location with label', async () => {
    const result = await sut.execute({
      titulo: 'Main Warehouse',
      type: 'WAREHOUSE',
      label: 'Primary storage facility',
    });

    expect(result.location.label).toBe('Primary storage facility');
  });

  it('should create a location with parent', async () => {
    const parent = await sut.execute({
      titulo: 'Warehouse 001',
      type: 'WAREHOUSE',
    });

    const result = await sut.execute({
      titulo: 'Zone A',
      type: 'ZONE',
      parentId: parent.location.id.toString(),
    });

    expect(result.location.parentId?.toString()).toBe(
      parent.location.id.toString(),
    );
  });

  it('should create a location with empty code (auto-generated)', async () => {
    const result = await sut.execute({
      titulo: 'Test Location',
      type: 'WAREHOUSE',
      code: '',
    });

    expect(result.location.code).toHaveLength(5);
    expect(result.location.titulo).toBe('Test Location');
    expect(result.location.type.value).toBe('WAREHOUSE');
  });

  it('should not create a location with code longer than 50 characters', async () => {
    await expect(
      sut.execute({
        titulo: 'Test Location',
        type: 'WAREHOUSE',
        code: 'a'.repeat(51),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should allow creating locations with duplicate codes', async () => {
    await sut.execute({
      titulo: 'Warehouse 1',
      type: 'WAREHOUSE',
      code: 'WH001',
    });

    const result = await sut.execute({
      titulo: 'Warehouse 2',
      type: 'WAREHOUSE',
      code: 'WH001',
    });

    expect(result.location.code).toBe('WH001');
    expect(result.location.titulo).toBe('Warehouse 2');
  });

  it('should not create a location with invalid type', async () => {
    await expect(
      sut.execute({
        titulo: 'Test Location',
        type: 'INVALID',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with negative capacity', async () => {
    await expect(
      sut.execute({
        titulo: 'Test Location',
        type: 'WAREHOUSE',
        capacity: -10,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with negative occupancy', async () => {
    await expect(
      sut.execute({
        titulo: 'Test Location',
        type: 'WAREHOUSE',
        currentOccupancy: -5,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with occupancy exceeding capacity', async () => {
    await expect(
      sut.execute({
        titulo: 'Test Location',
        type: 'WAREHOUSE',
        capacity: 100,
        currentOccupancy: 150,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a location with non-existent parent', async () => {
    await expect(
      sut.execute({
        titulo: 'Zone A',
        type: 'ZONE',
        parentId: 'non-existent-id',
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
