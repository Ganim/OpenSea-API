import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { CannotDeletePaidEntryError } from '@/@errors/use-cases/cannot-delete-paid-entry-error';
import { ConflictError } from '@/@errors/use-cases/conflict-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { GoneError } from '@/@errors/use-cases/gone-error';
import { NotImplementedError } from '@/@errors/use-cases/not-implemented-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { TooManyRequestsError } from '@/@errors/use-cases/too-many-requests-error';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { errorLogger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';
import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { env } from 'process';
import z, { ZodError } from 'zod';
import { ErrorCodes } from './error-codes';
import { UserBlockedError } from './use-cases/user-blocked-error';
import {
  VolumeNotFoundError,
  VolumeAlreadyExistsError,
  VolumeCannotBeClosed,
  VolumeItemAlreadyExistsError,
  VolumeItemNotFoundError,
  InvalidVolumeStatusError,
} from './volumes-errors';

export const errorHandler = (
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const requestId = request.requestId;

  // Silenciar opcionalmente logs de rate limit (429) em teste/CI
  const silenceRateLimitLogs =
    process.env.SILENCE_RATE_LIMIT_LOGS === 'true' ||
    process.env.SILENCE_RATE_LIMIT_LOGS === '1';

  // Handle Fastify validation errors (from Zod schemas)
  if (error.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      code: ErrorCodes.VALIDATION_ERROR,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      code: ErrorCodes.VALIDATION_ERROR,
      message: 'Validation error',
      requestId,
      details: z.treeifyError(error),
    });
  }

  if (error instanceof CannotDeletePaidEntryError) {
    return reply.status(400).send({
      code: error.code ?? ErrorCodes.FINANCE_CANNOT_DELETE_PAID_ENTRY,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      code: error.code ?? ErrorCodes.BAD_REQUEST,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof UserBlockedError) {
    return reply.status(403).send({
      code: ErrorCodes.USER_BLOCKED,
      message: error.message,
      requestId,
      blockedUntil: error.blockedUntil,
    });
  }

  if (error instanceof PasswordResetRequiredError) {
    return reply.status(403).send({
      code: ErrorCodes.PASSWORD_RESET_REQUIRED,
      message: error.message,
      requestId,
      resetToken: error.data.resetToken,
      reason: error.data.reason,
      requestedAt: error.data.requestedAt,
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      code: ErrorCodes.UNAUTHORIZED,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      code: ErrorCodes.FORBIDDEN,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      code: error.code ?? ErrorCodes.RESOURCE_NOT_FOUND,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof ConflictError) {
    return reply.status(409).send({
      code: error.code ?? ErrorCodes.OPTIMISTIC_LOCK_CONFLICT,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof GoneError) {
    return reply.status(410).send({
      code: ErrorCodes.BAD_REQUEST,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof TooManyRequestsError) {
    return reply.status(429).send({
      code: ErrorCodes.RATE_LIMITED,
      message: error.message,
      requestId,
    });
  }

  if (error instanceof NotImplementedError) {
    return reply.status(501).send({
      code: ErrorCodes.INTERNAL_ERROR,
      message: error.message,
      requestId,
    });
  }

  // Volume errors
  if (
    error instanceof VolumeNotFoundError ||
    error instanceof VolumeItemNotFoundError
  ) {
    const code =
      error instanceof VolumeNotFoundError
        ? ErrorCodes.VOLUME_NOT_FOUND
        : ErrorCodes.VOLUME_ITEM_NOT_FOUND;
    return reply.status(404).send({
      code,
      message: error.message,
      requestId,
    });
  }

  if (
    error instanceof VolumeAlreadyExistsError ||
    error instanceof VolumeItemAlreadyExistsError
  ) {
    const code =
      error instanceof VolumeAlreadyExistsError
        ? ErrorCodes.VOLUME_ALREADY_EXISTS
        : ErrorCodes.VOLUME_ITEM_ALREADY_EXISTS;
    return reply.status(409).send({
      code,
      message: error.message,
      requestId,
    });
  }

  if (
    error instanceof VolumeCannotBeClosed ||
    error instanceof InvalidVolumeStatusError
  ) {
    const code =
      error instanceof VolumeCannotBeClosed
        ? ErrorCodes.VOLUME_CANNOT_BE_CLOSED
        : ErrorCodes.INVALID_VOLUME_STATUS;
    return reply.status(400).send({
      code,
      message: error.message,
      requestId,
    });
  }

  // Rate limit errors (429) — manter sem log se silenciado
  const isRateLimitError =
    (error as { statusCode?: number })?.statusCode === 429 ||
    error.code === 'FST_ERR_RATE_LIMIT' ||
    /rate limit/i.test(error.message || '');

  if (isRateLimitError && silenceRateLimitLogs) {
    return reply.status(429).send({
      code: ErrorCodes.RATE_LIMITED,
      message: error.message,
      requestId,
    });
  }

  if (isRateLimitError) {
    return reply.status(429).send({
      code: ErrorCodes.RATE_LIMITED,
      message: error.message,
      requestId,
    });
  }

  errorLogger.error(
    { error: { message: error.message, stack: error.stack, code: error.code } },
    'Internal server error occurred',
  );

  // Capture unexpected errors in Sentry
  captureException(error, {
    userId: (request as FastifyRequest & { user?: { sub?: string } }).user?.sub,
    endpoint: request.url,
    method: request.method,
    extra: {
      requestId,
      params: request.params,
      query: request.query,
    },
  });

  return reply.status(500).send({
    code: ErrorCodes.INTERNAL_ERROR,
    message: 'Internal server error',
    requestId,
    ...(env.NODE_ENV !== 'production' && { details: error.message }),
  });
};
