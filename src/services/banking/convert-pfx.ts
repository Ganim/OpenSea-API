/**
 * Converts a PKCS#12 (.pfx/.p12) certificate bundle into PEM-encoded
 * certificate and private key buffers.
 *
 * Uses node-forge (already a project dependency) to avoid shelling out to openssl.
 */
import forge from 'node-forge';

interface ConvertPfxResult {
  cert: Buffer;
  key: Buffer;
}

export function convertPfxToPem(
  pfxBuffer: Buffer,
  password: string,
): ConvertPfxResult {
  const asn1 = forge.asn1.fromDer(pfxBuffer.toString('binary'));
  const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, password);

  // Extract certificate
  const certBags = p12.getBags({ bagType: forge.pki.oids.certBag });
  const certBag = certBags[forge.pki.oids.certBag];
  if (!certBag || certBag.length === 0 || !certBag[0].cert) {
    throw new Error('Nenhum certificado encontrado no arquivo .pfx');
  }
  const certPem = forge.pki.certificateToPem(certBag[0].cert);

  // Extract private key
  const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag });
  const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag];
  if (!keyBag || keyBag.length === 0 || !keyBag[0].key) {
    throw new Error('Nenhuma chave privada encontrada no arquivo .pfx');
  }
  const keyPem = forge.pki.privateKeyToPem(keyBag[0].key);

  return {
    cert: Buffer.from(certPem, 'utf-8'),
    key: Buffer.from(keyPem, 'utf-8'),
  };
}
