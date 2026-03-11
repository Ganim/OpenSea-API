/**
 * @deprecated Import from '@/mappers/stock/volume/volume-to-dto' or
 * '@/mappers/stock/volume/volume-prisma-to-domain' instead.
 * This file is kept for backward compatibility.
 */
export {
  type VolumeDTO,
  type VolumeItemDTO,
  VolumeMapper,
  VolumeItemMapper,
  volumeToDTO,
  volumeItemToDTO,
} from './volume/volume-to-dto';

export {
  volumePrismaToDomain,
  volumeToPersistence,
  volumeItemPrismaToDomain,
  volumeItemToPersistence,
} from './volume/volume-prisma-to-domain';
