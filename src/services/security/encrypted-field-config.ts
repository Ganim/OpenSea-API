/**
 * Centralized configuration of which fields are encrypted and which have blind indexes.
 *
 * - `encryptedFields`: fields stored as AES-256-GCM ciphertext (base64)
 * - `hashFields`: mapping of { sourceField: 'hashColumnName' } for HMAC-SHA256 blind indexes
 *
 * Rules:
 * - Only string fields are encrypted (not Decimal, Json, Bytes)
 * - Hash columns enable equality search on encrypted fields (WHERE cpf_hash = ?)
 * - Null/undefined values are never encrypted — they stay null
 */

export interface EncryptedModelConfig {
  encryptedFields: readonly string[];
  hashFields: Record<string, string>;
}

export const ENCRYPTED_FIELD_CONFIG: Record<string, EncryptedModelConfig> = {
  Employee: {
    encryptedFields: [
      // Documents
      'cpf',
      'rg',
      'pis',
      'ctpsNumber',
      'ctpsSeries',
      'voterTitle',
      'militaryDoc',
      // Financial
      'pixKey',
      'bankAccount',
      'bankAgency',
      // Contact
      'personalEmail',
      'mobilePhone',
      'emergencyPhone',
      'emergencyContact',
      // Address
      'address',
      'addressNumber',
      'complement',
      'neighborhood',
      'city',
      'state',
      'zipCode',
    ],
    hashFields: {
      cpf: 'cpfHash',
      rg: 'rgHash',
      pis: 'pisHash',
      pixKey: 'pixKeyHash',
      bankAccount: 'bankAccountHash',
    },
  },

  Customer: {
    encryptedFields: [
      'document',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
    ],
    hashFields: {
      document: 'documentHash',
      email: 'emailHash',
    },
  },

  Supplier: {
    encryptedFields: [
      'cnpj',
      'contact',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
    ],
    hashFields: {
      cnpj: 'cnpjHash',
      email: 'emailHash',
    },
  },

  Manufacturer: {
    encryptedFields: [
      'cnpj',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
    ],
    hashFields: {
      cnpj: 'cnpjHash',
    },
  },

  BankAccount: {
    encryptedFields: [
      'accountNumber',
      'agency',
      'agencyDigit',
      'accountDigit',
      'pixKey',
    ],
    hashFields: {
      accountNumber: 'accountNumberHash',
      pixKey: 'pixKeyHash',
    },
  },

  FinanceEntry: {
    encryptedFields: [
      'boletoBarcode',
      'boletoDigitLine',
      // supplierName and customerName REMOVED — business names, not PII.
      // Other modules (Supplier, Customer) store names in plaintext.
      // Encrypting them broke search (contains) and aggregation (GROUP BY) queries.
    ],
    hashFields: {},
  },

  Loan: {
    encryptedFields: ['contractNumber'],
    hashFields: {},
  },

  Consortium: {
    encryptedFields: ['contractNumber'],
    hashFields: {},
  },

  Organization: {
    encryptedFields: [
      'cnpj',
      'cpf',
      'stateRegistration',
      'municipalRegistration',
      'email',
      'phoneMain',
      'phoneAlt',
    ],
    hashFields: {
      cnpj: 'cnpjHash',
      cpf: 'cpfHash',
    },
  },

  OrganizationFiscalSettings: {
    encryptedFields: ['nfePassword', 'nfeCertificate'],
    hashFields: {},
  },

  OrganizationStakeholder: {
    encryptedFields: ['cpf'],
    hashFields: {
      cpf: 'cpfHash',
    },
  },

  Company: {
    encryptedFields: [
      'cnpj',
      'stateRegistration',
      'municipalRegistration',
      'email',
      'phoneMain',
      'phoneAlt',
    ],
    hashFields: {
      cnpj: 'cnpjHash',
    },
  },

  CompanyFiscalSettings: {
    encryptedFields: ['certificateA1Password', 'nfceCscToken', 'nfceCscId'],
    hashFields: {},
  },

  CompanyStakeholder: {
    encryptedFields: ['personDocumentMasked'],
    hashFields: {},
  },

  Absence: {
    encryptedFields: ['cid'],
    hashFields: {},
  },

  StorageShareLink: {
    encryptedFields: ['password'],
    hashFields: {},
  },
} as const;

/**
 * Helper to get config for a model, throwing if not configured.
 */
export function getModelEncryptionConfig(
  modelName: string,
): EncryptedModelConfig {
  const config = ENCRYPTED_FIELD_CONFIG[modelName];
  if (!config) {
    throw new Error(`No encryption config for model: ${modelName}`);
  }
  return config;
}

/**
 * All model names that have encryption configured.
 */
export const ENCRYPTED_MODELS = Object.keys(ENCRYPTED_FIELD_CONFIG);
