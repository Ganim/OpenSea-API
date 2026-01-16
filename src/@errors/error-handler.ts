import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ForbiddenError } from '@/@errors/use-cases/forbidden-error';
import { PasswordResetRequiredError } from '@/@errors/use-cases/password-reset-required-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UnauthorizedError } from '@/@errors/use-cases/unauthorized-error';
import { errorLogger } from '@/lib/logger';
import { captureException } from '@/lib/sentry';
import type { FastifyInstance, FastifyRequest } from 'fastify';
import { env } from 'process';
import z, { ZodError } from 'zod';
import { UserBlockedError } from './use-cases/user-blocked-error';
import {
  VolumeNotFoundError,
  VolumeAlreadyExistsError,
  VolumeCannotBeClosed,
  VolumeItemAlreadyExistsError,
  VolumeItemNotFoundError,
  InvalidVolumeStatusError,
} from './volumes-errors';

type FastifyErrorHandler = FastifyInstance['errorHandler'];

export const errorHandler: FastifyErrorHandler = (error, request, reply) => {
  // Silenciar opcionalmente logs de rate limit (429) em teste/CI
  const silenceRateLimitLogs =
    process.env.SILENCE_RATE_LIMIT_LOGS === 'true' ||
    process.env.SILENCE_RATE_LIMIT_LOGS === '1';

  // Handle Fastify validation errors (from Zod schemas)
  if (error.code === 'FST_ERR_VALIDATION') {
    return reply.status(400).send({
      message: error.message,
    });
  }

  if (error instanceof ZodError) {
    return reply.status(400).send({
      message: 'Validation error',
      errors: z.treeifyError(error),
    });
  }

  if (error instanceof BadRequestError) {
    return reply.status(400).send({
      message: error.message,
    });
  }

  if (error instanceof UserBlockedError) {
    return reply.status(403).send({
      message: error.message,
      blockedUntil: error.blockedUntil,
    });
  }

  if (error instanceof PasswordResetRequiredError) {
    return reply.status(403).send({
      message: error.message,
      code: error.code,
      resetToken: error.data.resetToken,
      reason: error.data.reason,
      requestedAt: error.data.requestedAt,
    });
  }

  if (error instanceof UnauthorizedError) {
    return reply.status(401).send({
      message: error.message,
    });
  }

  if (error instanceof ForbiddenError) {
    return reply.status(403).send({
      message: error.message,
    });
  }

  if (error instanceof ResourceNotFoundError) {
    return reply.status(404).send({
      message: error.message,
    });
  }

  // Volume errors
  if (error instanceof VolumeNotFoundError || error instanceof VolumeItemNotFoundError) {
    return reply.status(404).send({
      message: error.message,
    });
  }

  if (error instanceof VolumeAlreadyExistsError || error instanceof VolumeItemAlreadyExistsError) {
    return reply.status(409).send({
      message: error.message,
    });
  }

  if (error instanceof VolumeCannotBeClosed || error instanceof InvalidVolumeStatusError) {
    return reply.status(400).send({
      message: error.message,
    });
  }

  // Rate limit errors (429) — manter sem log se silenciado
  const isRateLimitError =
    (error as { statusCode?: number })?.statusCode === 429 ||
    error.code === 'FST_ERR_RATE_LIMIT' ||
    /rate limit/i.test(error.message || '');

  if (isRateLimitError && silenceRateLimitLogs) {
    return reply.status(429).send({
      message: error.message,
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
      requestId: request.requestId,
      params: request.params,
      query: request.query,
    },
  });

  return reply.status(500).send({
    message: 'Internal server error',
    requestId: request.requestId,
    errors: env.NODE_ENV !== 'production' ? error.message : undefined,
  });
};
