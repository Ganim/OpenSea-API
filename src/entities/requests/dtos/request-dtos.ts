import type { Role } from '@prisma/client';
import type { RequestPriority } from '../value-objects/request-priority';
import type { RequestStatus } from '../value-objects/request-status';
import type { RequestTargetType } from '../value-objects/request-target-type';
import type { RequestType } from '../value-objects/request-type';

export interface CreateRequestDTO {
  title: string;
  description: string;
  type: RequestType;
  category?: string;
  priority?: RequestPriority;
  targetType: RequestTargetType;
  targetId?: string; // ID do usuário ou grupo
  targetRole?: Role; // Se for por role
  dueDate?: Date;
  metadata?: Record<string, unknown>;
  requiresApproval?: boolean;
  requesterId: string;
}

export interface UpdateRequestDTO {
  title?: string;
  description?: string;
  category?: string;
  priority?: RequestPriority;
  dueDate?: Date;
  metadata?: Record<string, unknown>;
}

export interface AssignRequestDTO {
  assignedToId: string;
}

export interface ChangeRequestStatusDTO {
  status: RequestStatus;
  reason?: string;
}

export interface AddRequestCommentDTO {
  content: string;
  isInternal?: boolean;
  authorId: string;
}

export interface AddRequestAttachmentDTO {
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadedById: string;
}

export interface RequestInfoDTO {
  message: string;
  performedById: string;
}

export interface ProvideInfoDTO {
  response: string;
}

export interface CompleteRequestDTO {
  comment?: string;
}

export interface CancelRequestDTO {
  reason: string;
}
