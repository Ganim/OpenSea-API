import { BadRequestError } from '@/@errors/use-cases/bad-request-error';

export const COMPETENCY_MIN_SCORE = 0;
export const COMPETENCY_MAX_SCORE = 5;
export const COMPETENCY_NAME_MIN_LENGTH = 1;
export const COMPETENCY_NAME_MAX_LENGTH = 100;

/**
 * Valida que um score esta entre 0 e 5 inclusive e respeita incrementos de 0.5.
 * Retorna sem erro quando score for null/undefined.
 */
export function assertScoreInRange(
  score: number | undefined | null,
  fieldName: string,
): void {
  if (score === undefined || score === null) return;

  if (score < COMPETENCY_MIN_SCORE || score > COMPETENCY_MAX_SCORE) {
    throw new BadRequestError(
      `O campo ${fieldName} deve estar entre ${COMPETENCY_MIN_SCORE} e ${COMPETENCY_MAX_SCORE}`,
    );
  }

  const stepTimesTen = Math.round(score * 10);
  if (stepTimesTen % 5 !== 0) {
    throw new BadRequestError(
      `O campo ${fieldName} deve respeitar incrementos de 0.5`,
    );
  }
}

export function assertCompetencyName(name: string): void {
  if (
    name.length < COMPETENCY_NAME_MIN_LENGTH ||
    name.length > COMPETENCY_NAME_MAX_LENGTH
  ) {
    throw new BadRequestError(
      `O nome da competência deve ter entre ${COMPETENCY_NAME_MIN_LENGTH} e ${COMPETENCY_NAME_MAX_LENGTH} caracteres`,
    );
  }
}

export function assertPositiveWeight(weight: number | undefined): void {
  if (weight === undefined) return;
  if (weight <= 0) {
    throw new BadRequestError('O peso da competência deve ser positivo');
  }
}
