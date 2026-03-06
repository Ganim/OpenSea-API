import { describe, expect, it } from 'vitest';
import { isEmailHostObviouslySafe, isEmailPortValid } from './validate-email-host';

describe('isEmailHostObviouslySafe', () => {
  it('should block localhost', () => {
    expect(isEmailHostObviouslySafe('localhost')).toBe(false);
    expect(isEmailHostObviouslySafe('localhost.localdomain')).toBe(false);
  });

  it('should block loopback IPs', () => {
    expect(isEmailHostObviouslySafe('127.0.0.1')).toBe(false);
    expect(isEmailHostObviouslySafe('127.0.0.2')).toBe(false);
  });

  it('should block private class A (10.x.x.x)', () => {
    expect(isEmailHostObviouslySafe('10.0.0.1')).toBe(false);
    expect(isEmailHostObviouslySafe('10.255.255.255')).toBe(false);
  });

  it('should block private class B (172.16-31.x.x)', () => {
    expect(isEmailHostObviouslySafe('172.16.0.1')).toBe(false);
    expect(isEmailHostObviouslySafe('172.31.255.255')).toBe(false);
  });

  it('should allow non-private 172 ranges', () => {
    expect(isEmailHostObviouslySafe('172.15.0.1')).toBe(true);
    expect(isEmailHostObviouslySafe('172.32.0.1')).toBe(true);
  });

  it('should block private class C (192.168.x.x)', () => {
    expect(isEmailHostObviouslySafe('192.168.0.1')).toBe(false);
    expect(isEmailHostObviouslySafe('192.168.1.100')).toBe(false);
  });

  it('should block link-local (169.254.x.x) — AWS metadata service', () => {
    expect(isEmailHostObviouslySafe('169.254.169.254')).toBe(false);
    expect(isEmailHostObviouslySafe('169.254.0.1')).toBe(false);
  });

  it('should block this-network (0.x.x.x)', () => {
    expect(isEmailHostObviouslySafe('0.0.0.0')).toBe(false);
  });

  it('should block IPv6 loopback and private ranges', () => {
    expect(isEmailHostObviouslySafe('::1')).toBe(false);
    expect(isEmailHostObviouslySafe('fe80::1')).toBe(false);
    expect(isEmailHostObviouslySafe('fc00::1')).toBe(false);
    expect(isEmailHostObviouslySafe('fd12::1')).toBe(false);
  });

  it('should allow valid public IPs', () => {
    expect(isEmailHostObviouslySafe('8.8.8.8')).toBe(true);
    expect(isEmailHostObviouslySafe('1.1.1.1')).toBe(true);
    expect(isEmailHostObviouslySafe('200.147.3.157')).toBe(true);
  });

  it('should allow domain names (DNS resolved async)', () => {
    expect(isEmailHostObviouslySafe('imap.gmail.com')).toBe(true);
    expect(isEmailHostObviouslySafe('smtp.hostgator.com')).toBe(true);
    expect(isEmailHostObviouslySafe('mail.casaesmeralda.ind.br')).toBe(true);
  });
});

describe('isEmailPortValid', () => {
  it('should allow standard email ports', () => {
    expect(isEmailPortValid(25)).toBe(true);   // SMTP
    expect(isEmailPortValid(110)).toBe(true);  // POP3
    expect(isEmailPortValid(143)).toBe(true);  // IMAP
    expect(isEmailPortValid(465)).toBe(true);  // SMTPS
    expect(isEmailPortValid(587)).toBe(true);  // Submission
    expect(isEmailPortValid(993)).toBe(true);  // IMAPS
    expect(isEmailPortValid(995)).toBe(true);  // POP3S
    expect(isEmailPortValid(2525)).toBe(true); // Alt SMTP
  });

  it('should reject non-email ports', () => {
    expect(isEmailPortValid(22)).toBe(false);    // SSH
    expect(isEmailPortValid(80)).toBe(false);    // HTTP
    expect(isEmailPortValid(443)).toBe(false);   // HTTPS
    expect(isEmailPortValid(3306)).toBe(false);  // MySQL
    expect(isEmailPortValid(5432)).toBe(false);  // PostgreSQL
    expect(isEmailPortValid(6379)).toBe(false);  // Redis
    expect(isEmailPortValid(27017)).toBe(false); // MongoDB
  });
});
