import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { describe, expect, it } from 'vitest';
import { validateZoneStructureInput } from './validate-zone-structure';

describe('validateZoneStructureInput', () => {
  it('should accept valid structure', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 5,
        shelvesPerAisle: 10,
        binsPerShelf: 4,
      }),
    ).not.toThrow();
  });

  it('should throw when aisles > 99', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 100,
        shelvesPerAisle: 10,
        binsPerShelf: 4,
      }),
    ).toThrow(BadRequestError);
  });

  it('should throw when shelvesPerAisle > 999', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 5,
        shelvesPerAisle: 1000,
        binsPerShelf: 4,
      }),
    ).toThrow(BadRequestError);
  });

  it('should throw when binsPerShelf > 26', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 5,
        shelvesPerAisle: 10,
        binsPerShelf: 27,
      }),
    ).toThrow(BadRequestError);
  });

  it('should throw when aisles is negative', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: -1,
        shelvesPerAisle: 10,
        binsPerShelf: 4,
      }),
    ).toThrow(BadRequestError);
  });

  it('should throw when structure is empty without allowEmpty', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 0,
        shelvesPerAisle: 0,
        binsPerShelf: 0,
      }),
    ).toThrow(BadRequestError);
  });

  it('should accept empty structure with allowEmpty: true', () => {
    expect(() =>
      validateZoneStructureInput(
        {
          aisles: 0,
          shelvesPerAisle: 0,
          binsPerShelf: 0,
        },
        { allowEmpty: true },
      ),
    ).not.toThrow();
  });

  it('should validate aisleConfigs when provided', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 2,
        shelvesPerAisle: 10,
        binsPerShelf: 5,
        aisleConfigs: [
          { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
          { aisleNumber: 2, shelvesCount: 3, binsPerShelf: 2 },
        ],
      }),
    ).not.toThrow();
  });

  it('should throw on duplicate aisle numbers in configs', () => {
    expect(() =>
      validateZoneStructureInput({
        aisles: 2,
        shelvesPerAisle: 10,
        binsPerShelf: 5,
        aisleConfigs: [
          { aisleNumber: 1, shelvesCount: 10, binsPerShelf: 5 },
          { aisleNumber: 1, shelvesCount: 3, binsPerShelf: 2 },
        ],
      }),
    ).toThrow(BadRequestError);
  });
});
