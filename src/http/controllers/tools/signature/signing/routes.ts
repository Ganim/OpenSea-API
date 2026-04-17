import type { FastifyInstance } from 'fastify';
import { rateLimitConfig } from '@/config/rate-limits';
import rateLimit from '@fastify/rate-limit';
import { getSigningPageController } from './v1-get-signing-page.controller';
import { signDocumentController } from './v1-sign-document.controller';
import { rejectDocumentController } from './v1-reject-document.controller';
import { requestOTPController } from './v1-request-otp.controller';
import { verifyOTPController } from './v1-verify-otp.controller';

export async function signatureSigningRoutes(app: FastifyInstance) {
  // Public routes — NO verifyJwt, NO verifyTenant
  // Rate limited to prevent abuse
  app.register(
    async (publicApp) => {
      publicApp.register(rateLimit, rateLimitConfig.public);
      publicApp.register(getSigningPageController);
      publicApp.register(signDocumentController);
      publicApp.register(rejectDocumentController);
    },
    { prefix: '' },
  );

  // OTP routes — restrictive rate limit (5 per 10min per IP)
  // to prevent brute-force of the 6-digit OTP
  app.register(
    async (otpApp) => {
      otpApp.register(rateLimit, rateLimitConfig.signatureOtp);
      otpApp.register(requestOTPController);
      otpApp.register(verifyOTPController);
    },
    { prefix: '' },
  );
}
