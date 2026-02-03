import type { Volume } from '@/entities/stock/volume';
import type { VolumeItem } from '@/entities/stock/volume-item';
import type { PaginationParams } from '@/repositories/pagination-params';

export interface VolumeRepository {
  create(volume: Volume): Promise<void>;
  findById(id: string, tenantId: string): Promise<Volume | null>;
  findByCode(code: string, tenantId: string): Promise<Volume | null>;
  update(volume: Volume): Promise<void>;
  delete(id: string): Promise<void>;
  list(
    params: PaginationParams,
    tenantId: string,
  ): Promise<{ volumes: Volume[]; total: number }>;
  addItem(volumeItem: VolumeItem): Promise<void>;
  removeItem(volumeId: string, itemId: string): Promise<void>;
  getItemsByVolumeId(volumeId: string): Promise<VolumeItem[]>;
  countItemsByVolumeId(volumeId: string): Promise<number>;
}
