import type { Activity } from '@/entities/sales/activity';

export interface ActivityDTO {
  id: string;
  tenantId: string;
  dealId: string | null;
  contactId: string | null;
  type: string;
  title: string;
  description: string | null;
  status: string;
  dueDate: Date | null;
  completedAt: Date | null;
  duration: number | null;
  userId: string;
  createdAt: Date;
  updatedAt: Date | null;
  deletedAt: Date | null;
}

export function activityToDTO(activity: Activity): ActivityDTO {
  return {
    id: activity.id.toString(),
    tenantId: activity.tenantId.toString(),
    dealId: activity.dealId?.toString() ?? null,
    contactId: activity.contactId?.toString() ?? null,
    type: activity.type,
    title: activity.title,
    description: activity.description ?? null,
    status: activity.status,
    dueDate: activity.dueDate ?? null,
    completedAt: activity.completedAt ?? null,
    duration: activity.duration ?? null,
    userId: activity.userId.toString(),
    createdAt: activity.createdAt,
    updatedAt: activity.updatedAt ?? null,
    deletedAt: activity.deletedAt ?? null,
  };
}
