import type { OneOnOneTalkingPoint } from '@/entities/hr/one-on-one-talking-point';

export interface OneOnOneTalkingPointDTO {
  id: string;
  meetingId: string;
  addedByEmployeeId: string;
  content: string;
  isResolved: boolean;
  position: number;
  createdAt: Date;
}

export function oneOnOneTalkingPointToDTO(
  point: OneOnOneTalkingPoint,
): OneOnOneTalkingPointDTO {
  return {
    id: point.id.toString(),
    meetingId: point.meetingId.toString(),
    addedByEmployeeId: point.addedByEmployeeId.toString(),
    content: point.content,
    isResolved: point.isResolved,
    position: point.position,
    createdAt: point.createdAt,
  };
}
