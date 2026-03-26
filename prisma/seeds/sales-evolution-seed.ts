import type { PrismaClient } from '../generated/prisma/client.js';

/**
 * Sales Evolution seed: Quotes, Proposals, Workflows, Forms, Conversations,
 * Message Templates, Cashier Sessions, and Discount Rules.
 *
 * Must run AFTER sales-demo-data so that customers already exist.
 */
export async function seedSalesEvolutionData(
  prisma: PrismaClient,
  tenantId: string,
) {
  console.log('\n🚀 Criando dados de evolução de vendas para o tenant demo...');

  // -----------------------------------------------------------------------
  // 0. Lookup admin user + customer
  // -----------------------------------------------------------------------
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null },
  });

  if (!adminUser) {
    console.log('   ⚠️ Usuário admin não encontrado, pulando seed de evolução');
    return;
  }

  const techCorpCustomer = await prisma.customer.findFirst({
    where: { tenantId, name: 'Tech Corp Ltda', deletedAt: null },
  });

  const joaoSilvaCustomer = await prisma.customer.findFirst({
    where: { tenantId, name: 'João Silva', deletedAt: null },
  });

  if (!techCorpCustomer) {
    console.log(
      '   ⚠️ Cliente Tech Corp não encontrado, pulando seed de evolução',
    );
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Quotes
  // -----------------------------------------------------------------------
  console.log('   📋 Criando orçamentos (quotes)...');

  const existingQuote = await prisma.quote.findFirst({
    where: { tenantId, title: 'Orçamento ERP Módulo Estoque', deletedAt: null },
  });

  let createdQuotes = 0;

  if (!existingQuote) {
    // Draft quote 1 with 3 items
    await prisma.quote.create({
      data: {
        tenantId,
        customerId: techCorpCustomer.id,
        title: 'Orçamento ERP Módulo Estoque',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 30 * 86400000),
        notes: 'Inclui implantação e treinamento básico.',
        subtotal: 25500,
        discount: 500,
        total: 25000,
        createdBy: adminUser.id,
        items: {
          create: [
            {
              productName: 'Licença ERP - Módulo Estoque',
              quantity: 1,
              unitPrice: 15000,
              discount: 0,
              total: 15000,
            },
            {
              productName: 'Implantação e Configuração',
              quantity: 1,
              unitPrice: 8000,
              discount: 500,
              total: 7500,
            },
            {
              productName: 'Treinamento Presencial (8h)',
              quantity: 1,
              unitPrice: 2500,
              discount: 0,
              total: 2500,
            },
          ],
        },
      },
    });
    createdQuotes++;

    // Draft quote 2 with 3 items
    await prisma.quote.create({
      data: {
        tenantId,
        customerId: techCorpCustomer.id,
        title: 'Orçamento Suporte Anual',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 15 * 86400000),
        subtotal: 9600,
        discount: 0,
        total: 9600,
        createdBy: adminUser.id,
        items: {
          create: [
            {
              productName: 'Suporte Técnico Premium (12 meses)',
              quantity: 12,
              unitPrice: 500,
              discount: 0,
              total: 6000,
            },
            {
              productName: 'Backup em Nuvem (12 meses)',
              quantity: 12,
              unitPrice: 200,
              discount: 0,
              total: 2400,
            },
            {
              productName: 'Monitoramento 24/7 (12 meses)',
              quantity: 12,
              unitPrice: 100,
              discount: 0,
              total: 1200,
            },
          ],
        },
      },
    });
    createdQuotes++;

    // Sent quote
    if (joaoSilvaCustomer) {
      await prisma.quote.create({
        data: {
          tenantId,
          customerId: joaoSilvaCustomer.id,
          title: 'Orçamento Consultoria Personalizada',
          status: 'SENT',
          sentAt: new Date(Date.now() - 3 * 86400000),
          validUntil: new Date(Date.now() + 20 * 86400000),
          notes: 'Enviado por e-mail em 23/03.',
          subtotal: 5000,
          discount: 0,
          total: 5000,
          createdBy: adminUser.id,
          items: {
            create: [
              {
                productName: 'Consultoria Técnica (20h)',
                quantity: 20,
                unitPrice: 250,
                discount: 0,
                total: 5000,
              },
            ],
          },
        },
      });
      createdQuotes++;
    }
  }

  console.log(
    createdQuotes > 0
      ? `   ✅ ${createdQuotes} orçamentos criados`
      : '   ✅ Orçamentos já existiam',
  );

  // -----------------------------------------------------------------------
  // 2. Proposals
  // -----------------------------------------------------------------------
  console.log('   📄 Criando propostas comerciais...');

  const existingProposal = await prisma.proposal.findFirst({
    where: {
      tenantId,
      title: 'Proposta Comercial - Implantação ERP',
      deletedAt: null,
    },
  });

  let createdProposals = 0;

  if (!existingProposal) {
    // Draft proposal with 2 items
    await prisma.proposal.create({
      data: {
        tenantId,
        customerId: techCorpCustomer.id,
        title: 'Proposta Comercial - Implantação ERP',
        description:
          'Proposta para implantação completa do sistema ERP incluindo módulos de estoque, financeiro e vendas.',
        status: 'DRAFT',
        validUntil: new Date(Date.now() + 45 * 86400000),
        terms:
          'Pagamento em 3 parcelas. Garantia de 12 meses. Suporte técnico incluso nos primeiros 3 meses.',
        totalValue: 65000,
        createdBy: adminUser.id,
        items: {
          create: [
            {
              description: 'Licenciamento ERP Completo (3 módulos)',
              quantity: 1,
              unitPrice: 45000,
              total: 45000,
            },
            {
              description: 'Serviço de Implantação e Migração de Dados',
              quantity: 1,
              unitPrice: 20000,
              total: 20000,
            },
          ],
        },
      },
    });
    createdProposals++;

    // Sent proposal
    if (joaoSilvaCustomer) {
      await prisma.proposal.create({
        data: {
          tenantId,
          customerId: joaoSilvaCustomer.id,
          title: 'Proposta - Pacote de Horas Consultoria',
          description:
            'Pacote de horas para consultoria técnica e acompanhamento de projeto.',
          status: 'SENT',
          sentAt: new Date(Date.now() - 5 * 86400000),
          validUntil: new Date(Date.now() + 30 * 86400000),
          terms: 'Pagamento à vista com 10% de desconto.',
          totalValue: 10000,
          createdBy: adminUser.id,
          items: {
            create: [
              {
                description: 'Pacote 40h - Consultoria Técnica',
                quantity: 40,
                unitPrice: 250,
                total: 10000,
              },
            ],
          },
        },
      });
      createdProposals++;
    }
  }

  console.log(
    createdProposals > 0
      ? `   ✅ ${createdProposals} propostas criadas`
      : '   ✅ Propostas já existiam',
  );

  // -----------------------------------------------------------------------
  // 3. Workflows
  // -----------------------------------------------------------------------
  console.log('   ⚙️ Criando workflows de automação...');

  const existingWorkflow = await prisma.workflow.findFirst({
    where: {
      tenantId,
      name: 'Notificação de Novo Pedido',
      deletedAt: null,
    },
  });

  let createdWorkflows = 0;

  if (!existingWorkflow) {
    // Active workflow with 2 steps
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Notificação de Novo Pedido',
        description:
          'Envia e-mail de confirmação e cria tarefa de follow-up quando um pedido é criado.',
        trigger: 'ORDER_CREATED',
        isActive: true,
        executionCount: 12,
        lastExecutedAt: new Date(Date.now() - 2 * 86400000),
        steps: {
          create: [
            {
              order: 1,
              type: 'SEND_EMAIL',
              config: {
                templateId: 'order-confirmation',
                to: '{{customer.email}}',
                subject: 'Seu pedido foi recebido!',
              },
            },
            {
              order: 2,
              type: 'CREATE_TASK',
              config: {
                title: 'Follow-up pedido {{order.number}}',
                assignTo: 'owner',
                dueInDays: 3,
              },
            },
          ],
        },
      },
    });
    createdWorkflows++;

    // Inactive workflow
    await prisma.workflow.create({
      data: {
        tenantId,
        name: 'Alerta de Negócio Ganho',
        description:
          'Envia notificação para a equipe quando um deal é marcado como ganho.',
        trigger: 'DEAL_WON',
        isActive: false,
        executionCount: 0,
        steps: {
          create: [
            {
              order: 1,
              type: 'SEND_NOTIFICATION',
              config: {
                channel: 'in-app',
                message:
                  'Parabéns! O negócio "{{deal.title}}" foi fechado com sucesso!',
                recipients: 'team',
              },
            },
          ],
        },
      },
    });
    createdWorkflows++;
  }

  console.log(
    createdWorkflows > 0
      ? `   ✅ ${createdWorkflows} workflows criados`
      : '   ✅ Workflows já existiam',
  );

  // -----------------------------------------------------------------------
  // 4. Forms
  // -----------------------------------------------------------------------
  console.log('   📝 Criando formulários...');

  const existingForm = await prisma.form.findFirst({
    where: {
      tenantId,
      title: 'Formulário de Contato',
      deletedAt: null,
    },
  });

  let createdForms = 0;

  if (!existingForm) {
    await prisma.form.create({
      data: {
        tenantId,
        title: 'Formulário de Contato',
        description: 'Formulário para captação de leads no site institucional.',
        status: 'PUBLISHED',
        submissionCount: 5,
        createdBy: adminUser.id,
        fields: {
          create: [
            {
              label: 'Nome Completo',
              type: 'TEXT',
              isRequired: true,
              order: 0,
            },
            {
              label: 'E-mail',
              type: 'EMAIL',
              isRequired: true,
              order: 1,
            },
            {
              label: 'Mensagem',
              type: 'TEXTAREA',
              isRequired: false,
              order: 2,
            },
          ],
        },
      },
    });
    createdForms++;
  }

  console.log(
    createdForms > 0
      ? `   ✅ ${createdForms} formulários criados`
      : '   ✅ Formulários já existiam',
  );

  // -----------------------------------------------------------------------
  // 5. Conversations
  // -----------------------------------------------------------------------
  console.log('   💬 Criando conversas...');

  const existingConversation = await prisma.conversation.findFirst({
    where: {
      tenantId,
      subject: 'Dúvida sobre prazo de entrega',
      deletedAt: null,
    },
  });

  let createdConversations = 0;

  if (!existingConversation) {
    await prisma.conversation.create({
      data: {
        tenantId,
        customerId: techCorpCustomer.id,
        subject: 'Dúvida sobre prazo de entrega',
        status: 'OPEN',
        lastMessageAt: new Date(Date.now() - 1 * 86400000),
        createdBy: adminUser.id,
        messages: {
          create: [
            {
              senderName: 'Pedro Diretor',
              senderType: 'CUSTOMER',
              content:
                'Olá, gostaria de saber qual o prazo de entrega do pedido que fizemos na semana passada.',
              createdAt: new Date(Date.now() - 3 * 86400000),
            },
            {
              senderId: adminUser.id,
              senderName: 'Admin',
              senderType: 'AGENT',
              content:
                'Olá Pedro! O prazo estimado é de 5 a 7 dias úteis. Vou verificar o status exato e retorno em breve.',
              createdAt: new Date(Date.now() - 2 * 86400000),
            },
            {
              senderName: 'Pedro Diretor',
              senderType: 'CUSTOMER',
              content: 'Perfeito, agradeço a agilidade. Fico no aguardo.',
              createdAt: new Date(Date.now() - 1 * 86400000),
            },
          ],
        },
      },
    });
    createdConversations++;
  }

  console.log(
    createdConversations > 0
      ? `   ✅ ${createdConversations} conversas criadas`
      : '   ✅ Conversas já existiam',
  );

  // -----------------------------------------------------------------------
  // 6. Message Templates
  // -----------------------------------------------------------------------
  console.log('   ✉️ Criando templates de mensagem...');

  const existingTemplate = await prisma.messageTemplate.findFirst({
    where: {
      tenantId,
      name: 'Confirmação de Pedido',
      deletedAt: null,
    },
  });

  let createdTemplates = 0;

  if (!existingTemplate) {
    // EMAIL template
    await prisma.messageTemplate.create({
      data: {
        tenantId,
        name: 'Confirmação de Pedido',
        channel: 'EMAIL',
        subject: 'Pedido #{{orderNumber}} confirmado',
        body: `Olá {{customerName}},

Seu pedido #{{orderNumber}} foi confirmado com sucesso!

Valor total: R$ {{orderTotal}}
Previsão de entrega: {{deliveryDate}}

Agradecemos pela preferência.

Atenciosamente,
Equipe Comercial`,
        variables: JSON.parse(
          '["customerName", "orderNumber", "orderTotal", "deliveryDate"]',
        ),
        isActive: true,
        createdBy: adminUser.id,
      },
    });
    createdTemplates++;

    // WHATSAPP template
    await prisma.messageTemplate.create({
      data: {
        tenantId,
        name: 'Lembrete de Pagamento',
        channel: 'WHATSAPP',
        body: `Olá {{customerName}}, tudo bem? 🙂

Passando para lembrar que o boleto no valor de R$ {{amount}} vence em {{dueDate}}.

Se já efetuou o pagamento, por favor desconsidere esta mensagem.

Qualquer dúvida, estamos à disposição!`,
        variables: JSON.parse('["customerName", "amount", "dueDate"]'),
        isActive: true,
        createdBy: adminUser.id,
      },
    });
    createdTemplates++;

    // NOTIFICATION template
    await prisma.messageTemplate.create({
      data: {
        tenantId,
        name: 'Novo Negócio Atribuído',
        channel: 'NOTIFICATION',
        body: 'Você foi atribuído ao negócio "{{dealTitle}}" com o cliente {{customerName}}. Valor estimado: R$ {{dealValue}}.',
        variables: JSON.parse('["dealTitle", "customerName", "dealValue"]'),
        isActive: true,
        createdBy: adminUser.id,
      },
    });
    createdTemplates++;
  }

  console.log(
    createdTemplates > 0
      ? `   ✅ ${createdTemplates} templates de mensagem criados`
      : '   ✅ Templates de mensagem já existiam',
  );

  // -----------------------------------------------------------------------
  // 7. Cashier Sessions
  // -----------------------------------------------------------------------
  console.log('   💰 Criando sessões de caixa...');

  const existingSession = await prisma.cashierSession.findFirst({
    where: { tenantId, cashierId: adminUser.id, status: 'CLOSED' },
  });

  let createdSessions = 0;

  if (!existingSession) {
    await prisma.cashierSession.create({
      data: {
        tenantId,
        cashierId: adminUser.id,
        openedAt: new Date(Date.now() - 1 * 86400000),
        closedAt: new Date(Date.now() - 1 * 86400000 + 8 * 3600000),
        openingBalance: 200,
        closingBalance: 1350,
        expectedBalance: 1350,
        difference: 0,
        status: 'CLOSED',
        notes: 'Caixa do dia - expediente normal.',
        transactions: {
          create: [
            {
              type: 'SALE',
              amount: 1200,
              description: 'Venda de produtos diversos',
              paymentMethod: 'PIX',
            },
            {
              type: 'CASH_IN',
              amount: 150,
              description: 'Troco recebido do banco',
              paymentMethod: 'DINHEIRO',
            },
            {
              type: 'CASH_OUT',
              amount: 200,
              description: 'Pagamento de fornecedor em espécie',
              paymentMethod: 'DINHEIRO',
            },
          ],
        },
      },
    });
    createdSessions++;
  }

  console.log(
    createdSessions > 0
      ? `   ✅ ${createdSessions} sessões de caixa criadas`
      : '   ✅ Sessões de caixa já existiam',
  );

  // -----------------------------------------------------------------------
  // 8. Discount Rules
  // -----------------------------------------------------------------------
  console.log('   🏷️ Criando regras de desconto...');

  const existingDiscountRule = await prisma.discountRule.findFirst({
    where: {
      tenantId,
      name: '10% em pedidos acima de R$500',
      deletedAt: null,
    },
  });

  let createdDiscountRules = 0;

  if (!existingDiscountRule) {
    // PERCENTAGE rule
    await prisma.discountRule.create({
      data: {
        tenantId,
        name: '10% em pedidos acima de R$500',
        description:
          'Desconto de 10% aplicado automaticamente para pedidos com valor acima de R$500.',
        type: 'PERCENTAGE',
        value: 10,
        minOrderValue: 500,
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 86400000),
        isActive: true,
        priority: 1,
        isStackable: false,
      },
    });
    createdDiscountRules++;

    // FIXED_AMOUNT rule for specific customer
    await prisma.discountRule.create({
      data: {
        tenantId,
        name: 'R$50 off - Cliente VIP',
        description: 'Desconto fixo de R$50 para cliente VIP específico.',
        type: 'FIXED_AMOUNT',
        value: 50,
        customerId: techCorpCustomer.id,
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 86400000),
        isActive: true,
        priority: 2,
        isStackable: true,
      },
    });
    createdDiscountRules++;
  }

  console.log(
    createdDiscountRules > 0
      ? `   ✅ ${createdDiscountRules} regras de desconto criadas`
      : '   ✅ Regras de desconto já existiam',
  );

  console.log('   ✅ Dados de evolução de vendas criados com sucesso!');
}
