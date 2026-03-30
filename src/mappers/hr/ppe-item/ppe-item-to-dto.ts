import type { PPEItem } from '@/entities/hr/ppe-item';

export interface PPEItemDTO {
  id: string;
  name: string;
  category: string;
  caNumber: string | null;
  manufacturer: string | null;
  model: string | null;
  expirationMonths: number | null;
  minStock: number;
  currentStock: number;
  isActive: boolean;
  isLowStock: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export function ppeItemToDTO(ppeItem: PPEItem): PPEItemDTO {
  return {
    id: ppeItem.id.toString(),
    name: ppeItem.name,
    category: ppeItem.category,
    caNumber: ppeItem.caNumber ?? null,
    manufacturer: ppeItem.manufacturer ?? null,
    model: ppeItem.model ?? null,
    expirationMonths: ppeItem.expirationMonths ?? null,
    minStock: ppeItem.minStock,
    currentStock: ppeItem.currentStock,
    isActive: ppeItem.isActive,
    isLowStock: ppeItem.isLowStock(),
    notes: ppeItem.notes ?? null,
    createdAt: ppeItem.createdAt.toISOString(),
    updatedAt: ppeItem.updatedAt.toISOString(),
  };
}
