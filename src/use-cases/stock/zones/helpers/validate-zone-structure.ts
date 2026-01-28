import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import type { ZoneStructureProps } from '@/entities/stock/value-objects/zone-structure';

interface ValidateZoneStructureOptions {
  allowEmpty?: boolean;
}

export function validateZoneStructureInput(
  structure: Partial<ZoneStructureProps>,
  options: ValidateZoneStructureOptions = {},
): void {
  const { allowEmpty = false } = options;

  const aisles = structure.aisles ?? 0;
  const shelvesPerAisle = structure.shelvesPerAisle ?? 0;
  const binsPerShelf = structure.binsPerShelf ?? 0;
  const aisleConfigs = structure.aisleConfigs ?? [];
  const hasConfigs = aisleConfigs.length > 0;

  const minValue = allowEmpty || hasConfigs ? 0 : 1;

  assertRange(
    aisles,
    minValue,
    99,
    `Number of aisles must be between ${minValue} and 99.`,
  );
  assertRange(
    shelvesPerAisle,
    minValue,
    999,
    `Number of shelves per aisle must be between ${minValue} and 999.`,
  );
  assertRange(
    binsPerShelf,
    minValue,
    26,
    `Number of bins per shelf must be between ${minValue} and 26.`,
  );

  if (hasConfigs) {
    const seenAisleNumbers = new Set<number>();

    aisleConfigs.forEach((config, index) => {
      assertRange(
        config.aisleNumber,
        1,
        99,
        `Aisle config #${index + 1}: aisleNumber must be between 1 and 99.`,
      );
      assertRange(
        config.shelvesCount,
        1,
        999,
        `Aisle config #${index + 1}: shelvesCount must be between 1 and 999.`,
      );
      assertRange(
        config.binsPerShelf,
        1,
        26,
        `Aisle config #${index + 1}: binsPerShelf must be between 1 and 26.`,
      );

      if (seenAisleNumbers.has(config.aisleNumber)) {
        throw new BadRequestError('Aisle numbers must be unique.');
      }

      seenAisleNumbers.add(config.aisleNumber);
    });
  }

  if (!hasConfigs && !allowEmpty) {
    const isEmptyStructure =
      aisles === 0 || shelvesPerAisle === 0 || binsPerShelf === 0;

    if (isEmptyStructure) {
      throw new BadRequestError(
        'Zone structure must include aisles, shelves per aisle, and bins per shelf.',
      );
    }
  }
}

function assertRange(value: number, min: number, max: number, message: string) {
  if (value < min || value > max) {
    throw new BadRequestError(message);
  }
}
