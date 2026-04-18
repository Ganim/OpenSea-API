import {
  NotificationChannel,
  NotificationPriority,
  NotificationType,
  type ModuleNotificationManifest,
} from '../public/index.js';

const I = NotificationType.INFORMATIONAL;
const L = NotificationType.LINK;
const A = NotificationType.ACTIONABLE;
const AP = NotificationType.APPROVAL;
const IA = NotificationChannel.IN_APP;
const EM = NotificationChannel.EMAIL;
const PU = NotificationChannel.PUSH;
const NORMAL = NotificationPriority.NORMAL;
const HIGH = NotificationPriority.HIGH;
const URGENT = NotificationPriority.URGENT;
const LOW = NotificationPriority.LOW;

export const hrManifest: ModuleNotificationManifest = {
  module: 'hr',
  displayName: 'Recursos Humanos',
  icon: 'Users',
  order: 30,
  categories: [
    // Announcements
    {
      code: 'hr.announcement',
      name: 'Avisos da empresa',
      description: 'Comunicados internos publicados.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
      digestSupported: true,
    },
    {
      code: 'hr.announcement_updated',
      name: 'Aviso atualizado',
      description: 'Comunicado já recebido foi editado.',
      defaultType: L,
      defaultPriority: LOW,
      defaultChannels: [IA],
    },
    {
      code: 'hr.announcement_pinned',
      name: 'Aviso fixado',
      description: 'Comunicado marcado como prioritário.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // Training
    {
      code: 'hr.training_assigned',
      name: 'Treinamento atribuído',
      description: 'Você foi inscrito em um treinamento.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.training_expiring',
      name: 'Treinamento a vencer em 30 dias',
      description: 'Treinamento vence nos próximos 30 dias.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.training_expiring_7d',
      name: 'Treinamento a vencer em 7 dias',
      description: 'Treinamento vence na próxima semana.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM, PU],
    },
    {
      code: 'hr.training_expired',
      name: 'Treinamento vencido',
      description: 'Treinamento obrigatório expirou.',
      defaultType: L,
      defaultPriority: URGENT,
      defaultChannels: [IA, EM],
      mandatory: true,
    },
    {
      code: 'hr.training_completed',
      name: 'Treinamento concluído',
      description: 'Treinamento foi finalizado com sucesso.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // Vacation
    {
      code: 'hr.vacation_request',
      name: 'Solicitação de férias',
      description: 'Pedido de férias aguardando aprovação.',
      defaultType: AP,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.vacation_approved',
      name: 'Férias aprovadas',
      description: 'Retorno sobre aprovação.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.vacation_rejected',
      name: 'Férias rejeitadas',
      description: 'Solicitação de férias não aprovada.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.vacation_starts_today',
      name: 'Férias começam hoje',
      description: 'Lembrete de início do período.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA, PU],
    },
    {
      code: 'hr.vacation_returns_today',
      name: 'Retorno hoje',
      description: 'Funcionário retorna das férias hoje.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // Absence
    {
      code: 'hr.absence_approval',
      name: 'Aprovação de ausência',
      description: 'Ausência aguardando aprovação.',
      defaultType: AP,
      defaultPriority: HIGH,
      defaultChannels: [IA],
    },
    {
      code: 'hr.absence_submitted',
      name: 'Ausência registrada',
      description: 'Nova ausência submetida.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.medical_certificate_uploaded',
      name: 'Atestado médico enviado',
      description: 'Funcionário enviou atestado.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // Performance Reviews
    {
      code: 'hr.review_cycle_opened',
      name: 'Ciclo de avaliação aberto',
      description: 'Novo ciclo de performance iniciado.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.review_due',
      name: 'Avaliação a vencer',
      description: 'Avaliação de performance próxima do prazo.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM, PU],
    },
    {
      code: 'hr.review_submitted',
      name: 'Avaliação enviada',
      description: 'Avaliação foi concluída e enviada.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.feedback_received',
      name: 'Feedback recebido',
      description: 'Você recebeu um novo feedback.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // Payroll
    {
      code: 'hr.payroll_draft_ready',
      name: 'Folha em rascunho',
      description: 'Draft de folha pronto para revisão.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.payroll_closed',
      name: 'Folha fechada',
      description: 'Folha de pagamento foi fechada.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.payroll_paid',
      name: 'Pagamento realizado',
      description: 'Folha paga aos funcionários.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM, PU],
    },
    {
      code: 'hr.payslip_available',
      name: 'Holerite disponível',
      description: 'Seu holerite está disponível para download.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },

    // Contracts
    {
      code: 'hr.contract_generated',
      name: 'Contrato gerado',
      description: 'Contrato pronto para assinatura.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.contract_signed',
      name: 'Contrato assinado',
      description: 'Contrato foi assinado digitalmente.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.contract_expiring',
      name: 'Contrato a vencer',
      description: 'Contrato próximo do vencimento.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },

    // Documents
    {
      code: 'hr.document_expiring',
      name: 'Documento a vencer',
      description: 'Documento (CNH, CTPS, exame médico) vence em breve.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.document_expired',
      name: 'Documento vencido',
      description: 'Documento expirou e precisa de renovação.',
      defaultType: L,
      defaultPriority: URGENT,
      defaultChannels: [IA, EM],
    },

    // Kudos
    {
      code: 'hr.kudos_received',
      name: 'Kudos recebidos',
      description: 'Alguém reconheceu seu trabalho.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'hr.kudos_reply',
      name: 'Resposta em kudos',
      description: 'Nova resposta em thread de kudos.',
      defaultType: L,
      defaultPriority: LOW,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'hr.kudos_reaction',
      name: 'Reação em kudos',
      description: 'Alguém reagiu a um kudos seu.',
      defaultType: L,
      defaultPriority: LOW,
      defaultChannels: [IA],
      digestSupported: true,
    },

    // Onboarding
    {
      code: 'hr.onboarding_step_completed',
      name: 'Etapa de onboarding concluída',
      description: 'Um funcionário avançou no onboarding.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.onboarding_overdue',
      name: 'Onboarding atrasado',
      description: 'Funcionário não concluiu etapa no prazo.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },

    // Employee lifecycle
    {
      code: 'hr.employee_hired',
      name: 'Funcionário contratado',
      description: 'Novo funcionário ingressou na empresa.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.employee_promoted',
      name: 'Funcionário promovido',
      description: 'Mudança de cargo ou posição.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.employee_transferred',
      name: 'Funcionário transferido',
      description: 'Mudança de departamento.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.employee_terminated',
      name: 'Funcionário desligado',
      description: 'Desligamento registrado.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.employee_on_leave',
      name: 'Funcionário em licença',
      description: 'Status mudou para afastado.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // Time/ponto
    {
      code: 'hr.absence_without_justification',
      name: 'Ausência sem justificativa',
      description: 'Ponto não batido sem justificativa.',
      defaultType: L,
      defaultPriority: HIGH,
      defaultChannels: [IA, EM],
    },
    {
      code: 'hr.overtime_authorized',
      name: 'Hora extra autorizada',
      description: 'Horas extras foram aprovadas.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.time_entry_rejected',
      name: 'Lançamento de ponto rejeitado',
      description: 'Lançamento de ponto não aprovado.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },

    // eSocial
    {
      code: 'hr.esocial_transmitted',
      name: 'eSocial transmitido',
      description: 'Evento eSocial enviado ao governo.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.esocial_accepted',
      name: 'eSocial aceito',
      description: 'Evento eSocial aceito.',
      defaultType: I,
      defaultPriority: NORMAL,
      defaultChannels: [IA],
    },
    {
      code: 'hr.esocial_rejected',
      name: 'eSocial rejeitado',
      description: 'Evento eSocial rejeitado pelo governo.',
      defaultType: L,
      defaultPriority: URGENT,
      defaultChannels: [IA, EM],
      mandatory: true,
    },

    // Social
    {
      code: 'hr.birthday',
      name: 'Aniversário',
      description: 'Aniversariantes do dia.',
      defaultType: L,
      defaultPriority: LOW,
      defaultChannels: [IA],
      digestSupported: true,
    },
    {
      code: 'hr.work_anniversary',
      name: 'Aniversário de empresa',
      description: 'Tempo de casa completado.',
      defaultType: L,
      defaultPriority: NORMAL,
      defaultChannels: [IA, EM],
    },
  ],
};
