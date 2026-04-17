import { TerminationType } from '@/entities/hr/termination';

/**
 * Tipos de rescisão que, por natureza jurídica, NÃO respeitam estabilidade
 * provisória (gestante, acidentária, CIPA, dirigente sindical, etc.).
 *
 * - JUSTA_CAUSA: falta grave do empregado (Art. 482 CLT) — afasta qualquer
 *   garantia estabilitária.
 * - FALECIMENTO: término do contrato por morte do empregado — impossibilidade
 *   material de reintegração.
 * - PEDIDO_DEMISSAO: iniciativa do empregado — estabilidade protege contra
 *   ato do empregador, não impede o empregado de sair.
 * - RESCISAO_INDIRETA: iniciativa do empregado por falta grave do empregador.
 */
export const STABILITY_EXEMPT_TERMINATION_TYPES: readonly TerminationType[] = [
  TerminationType.JUSTA_CAUSA,
  TerminationType.FALECIMENTO,
  TerminationType.PEDIDO_DEMISSAO,
  TerminationType.RESCISAO_INDIRETA,
];

/**
 * String reasons aceitas por `TerminateEmployeeUseCase`. Mesma semântica dos
 * TerminationType acima, porém em formato legado de string livre.
 */
export const STABILITY_EXEMPT_REASONS: readonly string[] = [
  'JUSTA_CAUSA',
  'FALECIMENTO',
  'PEDIDO_DEMISSAO',
  'RESCISAO_INDIRETA',
];

export function isStabilityExemptType(type: TerminationType): boolean {
  return STABILITY_EXEMPT_TERMINATION_TYPES.includes(type);
}

export function isStabilityExemptReason(reason: string | null | undefined): boolean {
  if (!reason) return false;
  return STABILITY_EXEMPT_REASONS.includes(reason);
}
