import {
  FiscalDocumentEvent,
  type FiscalEventType,
} from '@/entities/fiscal/fiscal-document-event';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { prisma, Prisma } from '@/lib/prisma';
import type { FiscalDocumentEventsRepository } from '../fiscal-document-events-repository';

function toDomain(raw: Record<string, unknown>): FiscalDocumentEvent {
  return FiscalDocumentEvent.create(
    {
      id: new UniqueEntityID(raw.id as string),
      fiscalDocumentId: new UniqueEntityID(raw.fiscalDocumentId as string),
      type: raw.type as FiscalEventType,
      protocol: (raw.protocol as string) ?? undefined,
      description: (raw.description as string) ?? '',
      xmlRequest: (raw.xmlRequest as string) ?? undefined,
      xmlResponse: (raw.xmlResponse as string) ?? undefined,
      success: raw.success as boolean,
      errorCode: (raw.errorCode as string) ?? undefined,
      errorMessage: (raw.errorMessage as string) ?? undefined,
      createdAt: raw.createdAt as Date,
    },
    new UniqueEntityID(raw.id as string),
  );
}

export class PrismaFiscalDocumentEventsRepository
  implements FiscalDocumentEventsRepository
{
  async findByDocumentId(documentId: string): Promise<FiscalDocumentEvent[]> {
    const eventRecords = await prisma.fiscalDocumentEvent.findMany({
      where: { fiscalDocumentId: documentId },
      orderBy: { createdAt: 'asc' },
    });

    return eventRecords.map((record) =>
      toDomain(record as unknown as Record<string, unknown>),
    );
  }

  async create(event: FiscalDocumentEvent): Promise<void> {
    await prisma.fiscalDocumentEvent.create({
      data: {
        id: event.id.toString(),
        fiscalDocumentId: event.fiscalDocumentId.toString(),
        type: event.type as any,
        protocol: event.protocol ?? null,
        description: event.description || null,
        xmlRequest: event.xmlRequest ?? null,
        xmlResponse: event.xmlResponse ?? null,
        success: event.success,
        errorCode: event.errorCode ?? null,
        errorMessage: event.errorMessage ?? null,
        createdAt: event.createdAt,
      },
    });
  }
}
