import type { Location } from '@/entities/stock/location';

export interface LocationDTO {
  id: string;
  code: string;
  description?: string;
  locationType?: string;
  parentId?: string;
  capacity?: number;
  currentOccupancy?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  deletedAt?: Date;
}

export function locationToDTO(location: Location): LocationDTO {
  return {
    id: location.id.toString(),
    code: location.code,
    description: location.description,
    locationType: location.locationType?.value,
    parentId: location.parentId?.toString(),
    capacity: location.capacity,
    currentOccupancy: location.currentOccupancy,
    isActive: location.isActive,
    createdAt: location.createdAt,
    updatedAt: location.updatedAt,
    deletedAt: location.deletedAt,
  };
}
