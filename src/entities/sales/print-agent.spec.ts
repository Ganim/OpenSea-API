import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PrintAgent } from './print-agent';

describe('PrintAgent Entity', () => {
  it('should create a print agent with defaults', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Office Agent',
    });

    expect(agent.name).toBe('Office Agent');
    expect(agent.status).toBe('OFFLINE');
    expect(agent.pairingSecret).toBeDefined();
    expect(agent.pairingSecret).toHaveLength(64); // 32 bytes hex
    expect(agent.deviceTokenHash).toBeUndefined();
    expect(agent.deviceLabel).toBeUndefined();
    expect(agent.pairedAt).toBeUndefined();
    expect(agent.pairedByUserId).toBeUndefined();
    expect(agent.revokedAt).toBeUndefined();
    expect(agent.isPaired).toBe(false);
    expect(agent.createdAt).toBeInstanceOf(Date);
    expect(agent.deletedAt).toBeUndefined();
    expect(agent.lastSeenAt).toBeUndefined();
    expect(agent.ipAddress).toBeUndefined();
    expect(agent.hostname).toBeUndefined();
    expect(agent.osInfo).toBeUndefined();
    expect(agent.version).toBeUndefined();
  });

  it('should allow providing a custom pairing secret', () => {
    const secret = 'a'.repeat(64);
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Custom Secret Agent',
      pairingSecret: secret,
    });

    expect(agent.pairingSecret).toBe(secret);
  });

  it('should pair the agent and set all pairing fields', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent To Pair',
    });

    const tokenHash = 'abc123hash';
    const label = 'Windows 11 - STOCK-PC';
    const userId = 'user-01';

    agent.pair(tokenHash, label, userId);

    expect(agent.deviceTokenHash).toBe(tokenHash);
    expect(agent.deviceLabel).toBe(label);
    expect(agent.pairedByUserId).toBe(userId);
    expect(agent.pairedAt).toBeInstanceOf(Date);
    expect(agent.revokedAt).toBeUndefined();
    expect(agent.isPaired).toBe(true);
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should unpair the agent by setting revokedAt', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent To Unpair',
    });

    agent.pair('hash123', 'label', 'user-01');
    expect(agent.isPaired).toBe(true);

    agent.unpair();

    expect(agent.revokedAt).toBeInstanceOf(Date);
    expect(agent.isPaired).toBe(false);
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should allow re-pairing after unpair', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent Re-Pair',
    });

    agent.pair('hash-first', 'label-first', 'user-01');
    agent.unpair();
    expect(agent.isPaired).toBe(false);

    agent.pair('hash-second', 'label-second', 'user-02');
    expect(agent.isPaired).toBe(true);
    expect(agent.deviceTokenHash).toBe('hash-second');
    expect(agent.deviceLabel).toBe('label-second');
    expect(agent.pairedByUserId).toBe('user-02');
    expect(agent.revokedAt).toBeUndefined();
  });

  it('should update status and touch updatedAt', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent A',
    });

    expect(agent.updatedAt).toBeUndefined();

    agent.status = 'ONLINE';

    expect(agent.status).toBe('ONLINE');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should record heartbeat setting all fields', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Warehouse Agent',
    });

    agent.recordHeartbeat('192.168.1.100', 'warehouse-pc-01');

    expect(agent.status).toBe('ONLINE');
    expect(agent.lastSeenAt).toBeInstanceOf(Date);
    expect(agent.ipAddress).toBe('192.168.1.100');
    expect(agent.hostname).toBe('warehouse-pc-01');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should preserve existing ipAddress/hostname when heartbeat provides none', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent B',
    });

    agent.recordHeartbeat('10.0.0.1', 'host-a');
    agent.recordHeartbeat();

    expect(agent.ipAddress).toBe('10.0.0.1');
    expect(agent.hostname).toBe('host-a');
  });

  it('should mark agent offline', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent C',
    });

    agent.recordHeartbeat('10.0.0.2', 'host-b');
    expect(agent.status).toBe('ONLINE');

    agent.markOffline();
    expect(agent.status).toBe('OFFLINE');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should soft delete the agent', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent D',
    });

    expect(agent.deletedAt).toBeUndefined();

    agent.deletedAt = new Date();

    expect(agent.deletedAt).toBeInstanceOf(Date);
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should update name and touch updatedAt', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Old Name',
    });

    agent.name = 'New Name';

    expect(agent.name).toBe('New Name');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should update osInfo and version', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent E',
    });

    agent.osInfo = { platform: 'win32', arch: 'x64' };
    agent.version = '1.2.0';

    expect(agent.osInfo).toEqual({ platform: 'win32', arch: 'x64' });
    expect(agent.version).toBe('1.2.0');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });
});
