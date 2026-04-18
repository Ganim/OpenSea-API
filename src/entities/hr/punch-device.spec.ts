import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PunchDevice } from './punch-device';

describe('PunchDevice Entity', () => {
  it('deve criar um dispositivo com defaults (pairingSecret 64 hex, status OFFLINE)', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Kiosk Recepção',
      deviceKind: 'KIOSK_PUBLIC',
    });

    expect(device.name).toBe('Kiosk Recepção');
    expect(device.deviceKind).toBe('KIOSK_PUBLIC');
    expect(device.status).toBe('OFFLINE');
    expect(device.pairingSecret).toBeDefined();
    expect(device.pairingSecret).toHaveLength(64); // 32 bytes hex
    expect(device.deviceTokenHash).toBeUndefined();
    expect(device.deviceLabel).toBeUndefined();
    expect(device.geofenceZoneId).toBeUndefined();
    expect(device.pairedAt).toBeUndefined();
    expect(device.pairedByUserId).toBeUndefined();
    expect(device.revokedAt).toBeUndefined();
    expect(device.revokedByUserId).toBeUndefined();
    expect(device.revokedReason).toBeUndefined();
    expect(device.isPaired).toBe(false);
    expect(device.createdAt).toBeInstanceOf(Date);
    expect(device.updatedAt).toBeUndefined();
    expect(device.deletedAt).toBeUndefined();
    expect(device.lastSeenAt).toBeUndefined();
    expect(device.ipAddress).toBeUndefined();
    expect(device.hostname).toBeUndefined();
    expect(device.osInfo).toBeUndefined();
    expect(device.version).toBeUndefined();
  });

  it('deve permitir fornecer um pairingSecret customizado', () => {
    const secret = 'a'.repeat(64);
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Custom Secret',
      deviceKind: 'PWA_PERSONAL',
      pairingSecret: secret,
    });

    expect(device.pairingSecret).toBe(secret);
  });

  it('deve suportar os 4 deviceKinds exigidos por PUNCH-CORE-01', () => {
    const kinds: Array<
      'PWA_PERSONAL' | 'KIOSK_PUBLIC' | 'BIOMETRIC_READER' | 'WEBAUTHN_PC'
    > = ['PWA_PERSONAL', 'KIOSK_PUBLIC', 'BIOMETRIC_READER', 'WEBAUTHN_PC'];

    for (const kind of kinds) {
      const device = PunchDevice.create({
        tenantId: new UniqueEntityID(),
        name: `Device ${kind}`,
        deviceKind: kind,
      });
      expect(device.deviceKind).toBe(kind);
    }
  });

  it('isPaired retorna false quando deviceTokenHash é undefined', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Unpaired',
      deviceKind: 'KIOSK_PUBLIC',
    });

    expect(device.deviceTokenHash).toBeUndefined();
    expect(device.isPaired).toBe(false);
  });

  it('isPaired retorna false quando revokedAt está setado mesmo com deviceTokenHash presente', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Revoked',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.pair('hash-abc', 'Windows 11 - RECEP-PC', 'user-01');
    expect(device.isPaired).toBe(true);

    device.revoke('user-99', 'comprometido');
    expect(device.revokedAt).toBeInstanceOf(Date);
    // deviceTokenHash permanece (auditoria) mas isPaired deve ser false
    expect(device.deviceTokenHash).toBe('hash-abc');
    expect(device.isPaired).toBe(false);
  });

  it('pair() define deviceTokenHash, deviceLabel, pairedAt, pairedByUserId, limpa revokedAt, atualiza updatedAt', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'To Pair',
      deviceKind: 'KIOSK_PUBLIC',
    });

    const tokenHash = 'abc123hash';
    const label = 'Windows 11 - RECEP-PC';
    const userId = 'user-01';

    device.pair(tokenHash, label, userId);

    expect(device.deviceTokenHash).toBe(tokenHash);
    expect(device.deviceLabel).toBe(label);
    expect(device.pairedAt).toBeInstanceOf(Date);
    expect(device.pairedByUserId).toBe(userId);
    expect(device.revokedAt).toBeUndefined();
    expect(device.revokedByUserId).toBeUndefined();
    expect(device.revokedReason).toBeUndefined();
    expect(device.isPaired).toBe(true);
    expect(device.updatedAt).toBeInstanceOf(Date);
  });

  it('revoke() define revokedAt, revokedByUserId, revokedReason e atualiza updatedAt', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'To Revoke',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.pair('hash1', 'label', 'user-01');
    expect(device.isPaired).toBe(true);

    device.revoke('user-99', 'dispositivo perdido');

    expect(device.revokedAt).toBeInstanceOf(Date);
    expect(device.revokedByUserId).toBe('user-99');
    expect(device.revokedReason).toBe('dispositivo perdido');
    expect(device.isPaired).toBe(false);
    expect(device.updatedAt).toBeInstanceOf(Date);
  });

  it('revoke() sem reason deixa revokedReason undefined', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Device',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.revoke('user-99');

    expect(device.revokedAt).toBeInstanceOf(Date);
    expect(device.revokedByUserId).toBe('user-99');
    expect(device.revokedReason).toBeUndefined();
  });

  it('após revoke → pair sequence, revokedAt é limpo e isPaired vira true', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Re-pair',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.pair('hash-first', 'label-first', 'user-01');
    device.revoke('user-02', 'troca');
    expect(device.isPaired).toBe(false);

    device.pair('hash-second', 'label-second', 'user-03');

    expect(device.isPaired).toBe(true);
    expect(device.deviceTokenHash).toBe('hash-second');
    expect(device.deviceLabel).toBe('label-second');
    expect(device.pairedByUserId).toBe('user-03');
    expect(device.revokedAt).toBeUndefined();
    expect(device.revokedByUserId).toBeUndefined();
    expect(device.revokedReason).toBeUndefined();
  });

  it('recordHeartbeat() atualiza lastSeenAt, ipAddress, hostname e promove status para ONLINE', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Heartbeat',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.recordHeartbeat('192.168.1.100', 'kiosk-recep-01');

    expect(device.status).toBe('ONLINE');
    expect(device.lastSeenAt).toBeInstanceOf(Date);
    expect(device.ipAddress).toBe('192.168.1.100');
    expect(device.hostname).toBe('kiosk-recep-01');
    expect(device.updatedAt).toBeInstanceOf(Date);
  });

  it('recordHeartbeat() sem args preserva ipAddress/hostname anteriores', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Keep Fields',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.recordHeartbeat('10.0.0.1', 'host-a');
    device.recordHeartbeat();

    expect(device.ipAddress).toBe('10.0.0.1');
    expect(device.hostname).toBe('host-a');
  });

  it('markOffline() rebaixa status para OFFLINE e atualiza updatedAt', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Offline',
      deviceKind: 'KIOSK_PUBLIC',
    });

    device.recordHeartbeat('10.0.0.2', 'host-b');
    expect(device.status).toBe('ONLINE');

    device.markOffline();
    expect(device.status).toBe('OFFLINE');
    expect(device.updatedAt).toBeInstanceOf(Date);
  });

  it('deve permitir soft delete via setter deletedAt', () => {
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'Deletable',
      deviceKind: 'KIOSK_PUBLIC',
    });

    expect(device.deletedAt).toBeUndefined();

    device.deletedAt = new Date();

    expect(device.deletedAt).toBeInstanceOf(Date);
    expect(device.updatedAt).toBeInstanceOf(Date);
  });

  it('deve aceitar geofenceZoneId opcional no create', () => {
    const zoneId = new UniqueEntityID();
    const device = PunchDevice.create({
      tenantId: new UniqueEntityID(),
      name: 'With Geofence',
      deviceKind: 'KIOSK_PUBLIC',
      geofenceZoneId: zoneId,
    });

    expect(device.geofenceZoneId).toBeDefined();
    expect(device.geofenceZoneId?.toString()).toBe(zoneId.toString());
  });
});
