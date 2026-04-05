import type { Invoice } from '@/entities/sales/invoice';

export interface InvoiceDTO {
  id: string;
  tenantId: string;
  orderId: string;
  type: string;
  number: string;
  series: string;
  accessKey: string;
  focusIdRef?: string;
  status: string;
  statusDetails?: string;
  xmlUrl?: string;
  pdfUrl?: string;
  issuedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
  createdAt: Date;
  updatedAt?: Date;
}

export function invoiceToDTO(invoice: Invoice): InvoiceDTO {
  return {
    id: invoice.id.toString(),
    tenantId: invoice.tenantId.toString(),
    orderId: invoice.orderId.toString(),
    type: invoice.type,
    number: invoice.number,
    series: invoice.series,
    accessKey: invoice.accessKey,
    focusIdRef: invoice.focusIdRef,
    status: invoice.status,
    statusDetails: invoice.statusDetails,
    xmlUrl: invoice.xmlUrl,
    pdfUrl: invoice.pdfUrl,
    issuedAt: invoice.issuedAt,
    cancelledAt: invoice.cancelledAt,
    cancelReason: invoice.cancelReason,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}
