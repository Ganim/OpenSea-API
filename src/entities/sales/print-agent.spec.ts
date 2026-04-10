import { describe, expect, it } from 'vitest';
import { UniqueEntityID } from '../domain/unique-entity-id';
import { PrintAgent } from './print-agent';

describe('PrintAgent Entity', () => {
  it('should create a print agent with defaults', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Office Agent',
      apiKeyHash: 'hashed-key-value',
      apiKeyPrefix: 'oa_1234',
    });

    expect(agent.name).toBe('Office Agent');
    expect(agent.status).toBe('OFFLINE');
    expect(agent.apiKeyHash).toBe('hashed-key-value');
    expect(agent.apiKeyPrefix).toBe('oa_1234');
    expect(agent.createdAt).toBeInstanceOf(Date);
    expect(agent.deletedAt).toBeUndefined();
    expect(agent.lastSeenAt).toBeUndefined();
    expect(agent.ipAddress).toBeUndefined();
    expect(agent.hostname).toBeUndefined();
    expect(agent.osInfo).toBeUndefined();
    expect(agent.version).toBeUndefined();
  });

  it('should update status and touch updatedAt', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent A',
      apiKeyHash: 'hash',
      apiKeyPrefix: 'ag_0001',
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
      apiKeyHash: 'hash-abc',
      apiKeyPrefix: 'wa_5678',
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
      apiKeyHash: 'hash-def',
      apiKeyPrefix: 'ab_9999',
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
      apiKeyHash: 'hash-ghi',
      apiKeyPrefix: 'ac_1111',
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
      apiKeyHash: 'hash-jkl',
      apiKeyPrefix: 'ad_2222',
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
      apiKeyHash: 'hash-mno',
      apiKeyPrefix: 'on_3333',
    });

    agent.name = 'New Name';

    expect(agent.name).toBe('New Name');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });

  it('should update osInfo and version', () => {
    const agent = PrintAgent.create({
      tenantId: new UniqueEntityID(),
      name: 'Agent E',
      apiKeyHash: 'hash-pqr',
      apiKeyPrefix: 'ae_4444',
    });

    agent.osInfo = { platform: 'win32', arch: 'x64' };
    agent.version = '1.2.0';

    expect(agent.osInfo).toEqual({ platform: 'win32', arch: 'x64' });
    expect(agent.version).toBe('1.2.0');
    expect(agent.updatedAt).toBeInstanceOf(Date);
  });
});
