import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { InMemoryManufacturersRepository } from '@/repositories/stock/in-memory/in-memory-manufacturers-repository';
import { beforeEach, describe, expect, it } from 'vitest';
import { CreateManufacturerUseCase } from './create-manufacturer';

let manufacturersRepository: InMemoryManufacturersRepository;
let sut: CreateManufacturerUseCase;

describe('CreateManufacturerUseCase', () => {
  beforeEach(() => {
    manufacturersRepository = new InMemoryManufacturersRepository();
    sut = new CreateManufacturerUseCase(manufacturersRepository);
  });

  it('should create a manufacturer', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'TechCorp',
      country: 'United States',
      email: 'contact@techcorp.com',
      phone: '+1 (555) 123-4567',
      website: 'https://techcorp.com',
      city: 'San Francisco',
      state: 'CA',
      rating: 4.5,
    });

    expect(result.manufacturer).toEqual(
      expect.objectContaining({
        manufacturerId: expect.anything(),
        name: 'TechCorp',
        country: 'United States',
        email: 'contact@techcorp.com',
        phone: '+1 (555) 123-4567',
        website: 'https://techcorp.com',
        city: 'San Francisco',
        state: 'CA',
        rating: 4.5,
        isActive: true,
      }),
    );
  });

  it('should create a manufacturer without optional fields', async () => {
    const result = await sut.execute({
      tenantId: 'tenant-1',
      name: 'Simple Manufacturing',
      country: 'Brazil',
    });

    expect(result.manufacturer.name).toBe('Simple Manufacturing');
    expect(result.manufacturer.country).toBe('Brazil');
    expect(result.manufacturer.email).toBeNull();
    expect(result.manufacturer.phone).toBeNull();
  });

  it('should not create a manufacturer with empty name', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: '',
        country: 'Brazil',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a manufacturer with name longer than 200 characters', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'a'.repeat(201),
        country: 'Brazil',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a manufacturer with empty country', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'TechCorp',
        country: '',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a manufacturer with country longer than 100 characters', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'TechCorp',
        country: 'a'.repeat(101),
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a manufacturer with duplicate name', async () => {
    await sut.execute({
      tenantId: 'tenant-1',
      name: 'TechCorp',
      country: 'United States',
    });

    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'TechCorp',
        country: 'Brazil',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a manufacturer with invalid email', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'TechCorp',
        country: 'United States',
        email: 'invalid-email',
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should not create a manufacturer with invalid rating', async () => {
    await expect(
      sut.execute({
        tenantId: 'tenant-1',
        name: 'TechCorp',
        country: 'United States',
        rating: 6,
      }),
    ).rejects.toThrow(BadRequestError);
  });
});
