import crypto from 'crypto';

interface EnterpriseData {
  legalName?: string;
  cnpj?: string;
  taxRegime?: string;
  phone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  logoUrl?: string;
}

function generateCNPJ(): string {
  // Generate a random valid CNPJ format: XX.XXX.XXX/XXXX-XX
  const part1 = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');
  const part2 = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  const part3 = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0');
  const part4 = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, '0');
  const part5 = Math.floor(Math.random() * 100)
    .toString()
    .padStart(2, '0');

  return `${part1}.${part2}.${part3}/${part4}-${part5}`;
}

export function generateEnterpriseData(overrides?: EnterpriseData): EnterpriseData {
  return {
    legalName: overrides?.legalName ?? `Company ${crypto.randomBytes(4).toString('hex')}`,
    cnpj: overrides?.cnpj ?? generateCNPJ(),
    taxRegime: overrides?.taxRegime ?? 'Lucro Real',
    phone: overrides?.phone ?? '1133334444',
    address: overrides?.address ?? 'Rua das Flores',
    addressNumber: overrides?.addressNumber ?? '123',
    complement: overrides?.complement ?? 'Apto 101',
    neighborhood: overrides?.neighborhood ?? 'Centro',
    city: overrides?.city ?? 'São Paulo',
    state: overrides?.state ?? 'SP',
    zipCode: overrides?.zipCode ?? '01310100',
    country: overrides?.country ?? 'Brasil',
    logoUrl: overrides?.logoUrl ?? 'https://example.com/logo.png',
  };
}

export function generateCNPJForTest(): string {
  return generateCNPJ();
}
