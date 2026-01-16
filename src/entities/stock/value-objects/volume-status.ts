export enum VolumeStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  DELIVERED = 'DELIVERED',
  RETURNED = 'RETURNED',
}

export function isValidVolumeStatus(value: string): value is VolumeStatus {
  return Object.values(VolumeStatus).includes(value as VolumeStatus);
}

export function getVolumeStatusLabel(status: VolumeStatus): string {
  const labels: Record<VolumeStatus, string> = {
    [VolumeStatus.OPEN]: 'Aberto',
    [VolumeStatus.CLOSED]: 'Fechado',
    [VolumeStatus.DELIVERED]: 'Entregue',
    [VolumeStatus.RETURNED]: 'Devolvido',
  };
  return labels[status];
}
