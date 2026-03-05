import { prisma } from '@/lib/prisma';
import type { Prisma } from '@prisma/generated/client.js';
import type {
  CardCustomFieldValueRecord,
  CardCustomFieldValuesRepository,
  SetCardCustomFieldValueSchema,
} from '../card-custom-field-values-repository';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRecord(raw: any): CardCustomFieldValueRecord {
  return {
    id: raw.id,
    cardId: raw.cardId,
    fieldId: raw.fieldId,
    value: raw.value,
  };
}

export class PrismaCardCustomFieldValuesRepository
  implements CardCustomFieldValuesRepository
{
  async setValues(
    cardId: string,
    values: SetCardCustomFieldValueSchema[],
  ): Promise<CardCustomFieldValueRecord[]> {
    const results: CardCustomFieldValueRecord[] = [];

    for (const v of values) {
      const raw = await prisma.cardCustomFieldValue.upsert({
        where: { cardId_fieldId: { cardId, fieldId: v.fieldId } },
        create: {
          cardId,
          fieldId: v.fieldId,
          value: v.value as Prisma.InputJsonValue,
        },
        update: { value: v.value as Prisma.InputJsonValue },
      });

      results.push(toRecord(raw));
    }

    return results;
  }

  async findByCardId(cardId: string): Promise<CardCustomFieldValueRecord[]> {
    const rows = await prisma.cardCustomFieldValue.findMany({
      where: { cardId },
    });

    return rows.map(toRecord);
  }

  async deleteByFieldId(fieldId: string): Promise<void> {
    await prisma.cardCustomFieldValue.deleteMany({
      where: { fieldId },
    });
  }
}
