import type { FiscalDocument } from '@/entities/fiscal/fiscal-document';

export interface FiscalDocumentFilters {
  page: number;
  limit: number;
  type?: string;
  status?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface FiscalDocumentsRepository {
  findById(id: string): Promise<FiscalDocument | null>;
  findByAccessKey(accessKey: string): Promise<FiscalDocument | null>;
  findByTenantId(
    tenantId: string,
    params: FiscalDocumentFilters,
  ): Promise<{ documents: FiscalDocument[]; total: number }>;
  findNextNumber(
    configId: string,
    type: string,
    series: number,
  ): Promise<number>;
  create(document: FiscalDocument): Promise<void>;
  save(document: FiscalDocument): Promise<void>;
}
