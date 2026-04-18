import { PrismaPunchDevicesRepository } from '@/repositories/hr/prisma/prisma-punch-devices-repository';
import { ListPunchDevicesUseCase } from '../list-punch-devices';

export function makeListPunchDevicesUseCase() {
  return new ListPunchDevicesUseCase(new PrismaPunchDevicesRepository());
}
