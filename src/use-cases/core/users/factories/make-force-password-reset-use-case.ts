import { PrismaUsersRepository } from '@/repositories/core/prisma/prisma-users-repository';
import { EmailService } from '@/services/email-service';
import { ForcePasswordResetUseCase } from '../force-password-reset';

export function makeForcePasswordResetUseCase() {
  const usersRepository = new PrismaUsersRepository();
  const emailService = new EmailService();
  return new ForcePasswordResetUseCase(usersRepository, emailService);
}
