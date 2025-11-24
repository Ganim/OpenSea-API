import type { Location } from '@/entities/stock/location';

export interface LocationDTO {
  id: string;
  code: string;
  titulo: string;
  label?: string;
  type: string;
  parentId?: string;
  totalChilds: number;
  capacity?: number;
  currentOccupancy?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
  subLocationCount?: number;
  directItemCount?: number;
  totalItemCount?: number;
}

export function locationToDTO(
  location: Location,
  counts?: {
    subLocationCount?: number;
    directItemCount?: number;
    totalItemCount?: number;
  },
): LocationDTO {
  return {
    id: location.id.toString(),
    code: location.code,
    titulo: location.titulo,
    label: location.label,
    type: location.type.value,
    parentId: location.parentId?.toString(),
    totalChilds: location.totalChilds,
    capacity: location.capacity,
    currentOccupancy: location.currentOccupancy,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
    deletedAt: location.deletedAt,
    subLocationCount: counts?.subLocationCount,
    directItemCount: counts?.directItemCount,
    totalItemCount: counts?.totalItemCount,
  };
}
