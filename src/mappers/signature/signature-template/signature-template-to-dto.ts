import type { SignatureTemplate } from '@/entities/signature/signature-template';
import type { SignerSlot } from '@/entities/signature/signature-template';

export interface SignatureTemplateDTO {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  signatureLevel: string;
  routingType: string;
  signerSlots: SignerSlot[];
  expirationDays: number | null;
  reminderDays: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function signatureTemplateToDTO(
  template: SignatureTemplate,
): SignatureTemplateDTO {
  return {
    id: template.templateId.toString(),
    tenantId: template.tenantId.toString(),
    name: template.name,
    description: template.description,
    signatureLevel: template.signatureLevel,
    routingType: template.routingType,
    signerSlots: template.signerSlots,
    expirationDays: template.expirationDays,
    reminderDays: template.reminderDays,
    isActive: template.isActive,
    createdAt: template.createdAt,
    updatedAt: template.updatedAt,
  };
}
