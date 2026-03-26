/**
 * Banco de Horas — Verificação de Validade (Art. 59 CLT)
 *
 * - Acordo individual: expira em 6 meses (Art. 59, §5º CLT)
 * - Acordo coletivo: expira em 12 meses (Art. 59, §2º CLT)
 *
 * Quando expirado:
 * - Saldo positivo: deve ser pago como hora extra (50% ou 100%)
 * - Saldo negativo: é perdoado (não pode ser descontado do empregado)
 */

export type TimeBankAgreementType = 'INDIVIDUAL' | 'COLLECTIVE';

export interface TimeBankEntry {
  id: string;
  employeeId: string;
  balance: number; // hours (positive = employee credit, negative = employee debt)
  year: number;
  agreementType: TimeBankAgreementType;
  expirationDate?: Date | null;
  createdAt: Date;
}

export interface TimeBankExpiryResult {
  isExpired: boolean;
  expirationDate: Date;
  /** Positive balance to be paid as overtime */
  overtimePayable: number;
  /** Negative balance to be forgiven */
  balanceForgiven: number;
  /** Descriptive message */
  message: string;
}

/** Default validity in months per agreement type */
const DEFAULT_VALIDITY_MONTHS: Record<TimeBankAgreementType, number> = {
  INDIVIDUAL: 6,
  COLLECTIVE: 12,
};

/**
 * Calculates the expiration date for a time bank entry.
 * Uses explicit expirationDate if set, otherwise calculates from createdAt + validity.
 */
export function getTimeBankExpirationDate(
  entry: TimeBankEntry,
  customValidityMonths?: number,
): Date {
  if (entry.expirationDate) {
    return new Date(entry.expirationDate);
  }

  const validityMonths =
    customValidityMonths ?? DEFAULT_VALIDITY_MONTHS[entry.agreementType];

  const expiration = new Date(entry.createdAt);
  expiration.setMonth(expiration.getMonth() + validityMonths);
  return expiration;
}

/**
 * Checks whether a time bank entry has expired and returns settlement details.
 *
 * @param entry The time bank entry to check
 * @param referenceDate The date to check against (default: now)
 * @param customValidityMonths Override validity from HrTenantConfig
 */
export function checkTimeBankExpiry(
  entry: TimeBankEntry,
  referenceDate: Date = new Date(),
  customValidityMonths?: number,
): TimeBankExpiryResult {
  const expirationDate = getTimeBankExpirationDate(entry, customValidityMonths);
  const isExpired = referenceDate >= expirationDate;

  if (!isExpired) {
    return {
      isExpired: false,
      expirationDate,
      overtimePayable: 0,
      balanceForgiven: 0,
      message: `Banco de horas válido até ${expirationDate.toLocaleDateString('pt-BR')}`,
    };
  }

  // Entry is expired — determine settlement
  const balance = entry.balance;

  if (balance > 0) {
    // Positive balance: must be paid as overtime
    return {
      isExpired: true,
      expirationDate,
      overtimePayable: Math.round(balance * 100) / 100,
      balanceForgiven: 0,
      message: `Banco de horas expirado. ${balance.toFixed(2)}h de saldo positivo devem ser pagas como hora extra.`,
    };
  }

  if (balance < 0) {
    // Negative balance: forgiven (cannot deduct from employee)
    return {
      isExpired: true,
      expirationDate,
      overtimePayable: 0,
      balanceForgiven: Math.round(Math.abs(balance) * 100) / 100,
      message: `Banco de horas expirado. ${Math.abs(balance).toFixed(2)}h de saldo negativo perdoadas (não pode ser descontado).`,
    };
  }

  // Zero balance
  return {
    isExpired: true,
    expirationDate,
    overtimePayable: 0,
    balanceForgiven: 0,
    message: 'Banco de horas expirado. Saldo zero — nenhuma ação necessária.',
  };
}

/**
 * Batch-checks all time bank entries for a tenant and returns those that are expired.
 */
export function findExpiredTimeBanks(
  entries: TimeBankEntry[],
  referenceDate: Date = new Date(),
  customValidityByType?: Partial<Record<TimeBankAgreementType, number>>,
): Array<{ entry: TimeBankEntry; result: TimeBankExpiryResult }> {
  const expired: Array<{ entry: TimeBankEntry; result: TimeBankExpiryResult }> =
    [];

  for (const entry of entries) {
    const customMonths = customValidityByType?.[entry.agreementType];
    const result = checkTimeBankExpiry(entry, referenceDate, customMonths);

    if (result.isExpired) {
      expired.push({ entry, result });
    }
  }

  return expired;
}
