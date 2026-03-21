import type { Contact } from '@/entities/sales/contact';

export interface ContactDTO {
  id: string;
  tenantId: string;
  customerId: string;
  firstName: string;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  role: string;
  jobTitle: string | null;
  department: string | null;
  lifecycleStage: string;
  leadScore: number;
  leadTemperature: string | null;
  source: string;
  lastInteractionAt: Date | null;
  lastChannelUsed: string | null;
  socialProfiles: Record<string, unknown> | null;
  tags: string[];
  customFields: Record<string, unknown> | null;
  avatarUrl: string | null;
  assignedToUserId: string | null;
  isMainContact: boolean;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function contactToDTO(contact: Contact): ContactDTO {
  return {
    id: contact.id.toString(),
    tenantId: contact.tenantId.toString(),
    customerId: contact.customerId.toString(),
    firstName: contact.firstName,
    lastName: contact.lastName ?? null,
    fullName: contact.fullName,
    email: contact.email ?? null,
    phone: contact.phone ?? null,
    whatsapp: contact.whatsapp ?? null,
    role: contact.role.value,
    jobTitle: contact.jobTitle ?? null,
    department: contact.department ?? null,
    lifecycleStage: contact.lifecycleStage.value,
    leadScore: contact.leadScore,
    leadTemperature: contact.leadTemperature ?? null,
    source: contact.source,
    lastInteractionAt: contact.lastInteractionAt ?? null,
    lastChannelUsed: contact.lastChannelUsed ?? null,
    socialProfiles: contact.socialProfiles ?? null,
    tags: contact.tags,
    customFields: contact.customFields ?? null,
    avatarUrl: contact.avatarUrl ?? null,
    assignedToUserId: contact.assignedToUserId?.toString() ?? null,
    isMainContact: contact.isMainContact,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt ?? null,
    deletedAt: contact.deletedAt ?? null,
  };
}
