import { BadRequestError } from '@/@errors/use-cases/bad-request-error';
import { ResourceNotFoundError } from '@/@errors/use-cases/resource-not-found';
import { UniqueEntityID } from '@/entities/domain/unique-entity-id';
import { UserDTO, userToDTO } from '@/mappers/core/user/user-to-dto';
import type { UsersRepository } from '@/repositories/core/users-repository';
import type { EmailService } from '@/services/email-service';

interface ForcePasswordResetRequest {
  targetUserId: string;
  requestedByUserId: string;
  reason?: string;
  sendEmail?: boolean;
}

interface ForcePasswordResetResponse {
  user: UserDTO;
  message: string;
}

export class ForcePasswordResetUseCase {
  constructor(
    private usersRepository: UsersRepository,
    private emailService: EmailService,
  ) {}

  async execute({
    targetUserId,
    requestedByUserId,
    reason,
    sendEmail = false,
  }: ForcePasswordResetRequest): Promise<ForcePasswordResetResponse> {
    const targetId = new UniqueEntityID(targetUserId);
    const requestedById = new UniqueEntityID(requestedByUserId);

    const targetUser = await this.usersRepository.findById(targetId);
    if (!targetUser || targetUser.deletedAt) {
      throw new ResourceNotFoundError('User not found');
    }

    const requester = await this.usersRepository.findById(requestedById);
    if (!requester) {
      throw new BadRequestError('Invalid requester');
    }

    if (targetUser.forcePasswordReset) {
      throw new BadRequestError(
        'User already has a pending forced password reset',
      );
    }

    const updatedUser = await this.usersRepository.setForcePasswordReset(
      targetId,
      requestedById,
      reason,
    );

    if (!updatedUser) {
      throw new BadRequestError('Failed to set forced password reset');
    }

    if (sendEmail) {
      const emailTitle = 'Redefinição de Senha Obrigatória';
      const emailMessage = reason
        ? `Um administrador solicitou que você redefina sua senha. Motivo: ${reason}. Acesse o sistema para criar uma nova senha.`
        : 'Um administrador solicitou que você redefina sua senha. Acesse o sistema para criar uma nova senha.';

      await this.emailService.sendNotificationEmail(
        targetUser.email.value,
        emailTitle,
        emailMessage,
      );
    }

    return {
      user: userToDTO(updatedUser),
      message: sendEmail
        ? 'Forced password reset set successfully. Notification email sent.'
        : 'Forced password reset set successfully.',
    };
  }
}
