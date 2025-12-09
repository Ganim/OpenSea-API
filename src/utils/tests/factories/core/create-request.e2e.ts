import { prisma } from '@/lib/prisma';
import type {
  RequestPriority,
  RequestStatus,
  RequestType,
  RequestTargetType,
} from '@prisma/client';

interface CreateRequestProps {
  title?: string;
  description?: string;
  type?: RequestType;
  priority?: RequestPriority;
  status?: RequestStatus;
  targetType?: RequestTargetType;
  targetId?: string;
  requesterId: string;
  assignedToId?: string;
  dueDate?: Date;
}

export async function createRequestE2E({
  title = 'Test Request',
  description = 'Test description',
  type = 'ACCESS_REQUEST',
  priority = 'MEDIUM',
  status = 'SUBMITTED',
  targetType = 'USER',
  targetId,
  requesterId,
  assignedToId,
  dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
}: CreateRequestProps) {
  const timestamp = Date.now();
  const uniqueTitle = `${title} ${timestamp}`;

  return await prisma.request.create({
    data: {
      title: uniqueTitle,
      description,
      type,
      priority,
      status,
      targetType,
      targetId: targetId || requesterId,
      requesterId,
      assignedToId,
      dueDate,
    },
  });
}
