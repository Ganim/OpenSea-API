import type { SignatureAuditEvent } from '@/entities/signature/signature-audit-event';

export interface SignatureAuditEventDTO {
  id: string;
  envelopeId: string;
  tenantId: string;
  type: string;
  signerId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  geoLatitude: number | null;
  geoLongitude: number | null;
  metadata: Record<string, unknown> | null;
  timestamp: Date;
}

export function signatureAuditEventToDTO(
  event: SignatureAuditEvent,
): SignatureAuditEventDTO {
  return {
    id: event.eventId.toString(),
    envelopeId: event.envelopeId,
    tenantId: event.tenantId.toString(),
    type: event.type,
    signerId: event.signerId,
    description: event.description,
    ipAddress: event.ipAddress,
    userAgent: event.userAgent,
    geoLatitude: event.geoLatitude,
    geoLongitude: event.geoLongitude,
    metadata: event.metadata,
    timestamp: event.timestamp,
  };
}
