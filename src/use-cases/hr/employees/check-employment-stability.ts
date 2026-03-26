import type { Employee } from '@/entities/hr/employee';

export interface StabilityCheck {
  isStable: boolean;
  reason?: string;
  stableUntil?: Date;
}

/**
 * Verifica estabilidade provisória do funcionário conforme legislação brasileira.
 *
 * - Gestante: estável da confirmação da gravidez até 5 meses após o parto (ADCT Art. 10, II, b)
 * - Acidente de trabalho: estável por 12 meses após retorno (Art. 118, Lei 8.213/91) — via metadata
 * - Membro da CIPA: estável durante mandato + 1 ano após (Art. 10, II, a, ADCT) — via metadata
 */
export function checkEmploymentStability(employee: Employee): StabilityCheck {
  const now = new Date();

  // 1. Estabilidade gestante
  if (employee.isPregnant || employee.childBirthDate) {
    const birthDate = employee.childBirthDate;
    if (birthDate) {
      const stableUntil = new Date(birthDate);
      stableUntil.setMonth(stableUntil.getMonth() + 5);

      if (now < stableUntil) {
        return {
          isStable: true,
          reason: 'Estabilidade gestante (ADCT Art. 10, II, b)',
          stableUntil,
        };
      }
    } else if (employee.isPregnant) {
      return {
        isStable: true,
        reason: 'Gestante — estabilidade provisória (ADCT Art. 10, II, b)',
      };
    }
  }

  // 2. Estabilidade por acidente de trabalho (12 meses após retorno do auxílio-doença acidentário B91)
  const metadata = employee.metadata;
  if (metadata?.workAccidentReturnDate) {
    const returnDate = new Date(metadata.workAccidentReturnDate as string);
    const stableUntil = new Date(returnDate);
    stableUntil.setMonth(stableUntil.getMonth() + 12);

    if (now < stableUntil) {
      return {
        isStable: true,
        reason:
          'Estabilidade acidentária — 12 meses após retorno (Art. 118, Lei 8.213/91)',
        stableUntil,
      };
    }
  }

  // 3. Estabilidade CIPA (mandato + 1 ano)
  if (metadata?.cipaTermEnd) {
    const cipaEnd = new Date(metadata.cipaTermEnd as string);
    const stableUntil = new Date(cipaEnd);
    stableUntil.setFullYear(stableUntil.getFullYear() + 1);

    if (now < stableUntil) {
      return {
        isStable: true,
        reason:
          'Estabilidade CIPA — mandato + 1 ano (ADCT Art. 10, II, a)',
        stableUntil,
      };
    }
  }

  return { isStable: false };
}
