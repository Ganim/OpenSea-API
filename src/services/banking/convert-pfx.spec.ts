import { describe, expect, it } from 'vitest';
import forge from 'node-forge';
import { convertPfxToPem } from './convert-pfx';

function createTestPfx(password: string): Buffer {
  // Generate a self-signed cert + key pair for testing
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

  const attrs = [{ name: 'commonName', value: 'Test Cert' }];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Create PKCS#12
  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, [cert], password);
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
}

describe('convertPfxToPem', () => {
  it('should extract cert and key from a valid .pfx', () => {
    const pfx = createTestPfx('test123');
    const result = convertPfxToPem(pfx, 'test123');

    expect(result.cert.toString('utf-8')).toContain(
      '-----BEGIN CERTIFICATE-----',
    );
    expect(result.key.toString('utf-8')).toContain(
      '-----BEGIN RSA PRIVATE KEY-----',
    );
  });

  it('should throw on wrong password', () => {
    const pfx = createTestPfx('correct');
    expect(() => convertPfxToPem(pfx, 'wrong')).toThrow();
  });

  it('should throw on invalid buffer', () => {
    expect(() => convertPfxToPem(Buffer.from('not a pfx'), 'pass')).toThrow();
  });
});
