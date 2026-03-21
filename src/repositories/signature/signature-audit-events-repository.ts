import type { SignatureAuditEvent } from '@/entities/signature/signature-audit-event';

export interface CreateAuditEventSchema {
  envelopeId: string;
  tenantId: string;
  type: string;
  signerId?: string | null;
  description: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  geoLatitude?: number | null;
  geoLongitude?: number | null;
  metadata?: Record<string, unknown> | null;
}

export interface SignatureAuditEventsRepository {
  create(data: CreateAuditEventSchema): Promise<SignatureAuditEvent>;
  findByEnvelopeId(envelopeId: string): Promise<SignatureAuditEvent[]>;
}
