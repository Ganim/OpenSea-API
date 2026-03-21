import type { PrismaClient } from '../generated/prisma/client.js';

export async function seedSalesDemoData(
  prisma: PrismaClient,
  tenantId: string,
) {
  console.log('\n🛒 Criando dados demo de CRM para o tenant demo...');

  // -----------------------------------------------------------------------
  // 0. Find admin user (to assign as owner of activities)
  // -----------------------------------------------------------------------
  const adminUser = await prisma.user.findFirst({
    where: { email: 'admin@teste.com', deletedAt: null },
  });

  if (!adminUser) {
    console.log('   ⚠️ Usuário admin não encontrado, pulando demo CRM');
    return;
  }

  // -----------------------------------------------------------------------
  // 1. Find "Venda Simples" pipeline and its stages
  // -----------------------------------------------------------------------
  const pipeline = await prisma.crmPipeline.findFirst({
    where: { tenantId, name: 'Venda Simples', deletedAt: null },
    include: { stages: true },
  });

  if (!pipeline) {
    console.log(
      '   ⚠️ Pipeline "Venda Simples" não encontrado, pulando demo CRM',
    );
    return;
  }

  const stageMap = new Map(pipeline.stages.map((s) => [s.name, s.id]));

  const qualificacao = stageMap.get('Qualificacao');
  const proposta = stageMap.get('Proposta');
  const negociacao = stageMap.get('Negociacao');
  const ganho = stageMap.get('Fechado/Ganho');
  const perdido = stageMap.get('Perdido');

  if (!qualificacao || !proposta || !negociacao || !ganho || !perdido) {
    console.log('   ⚠️ Estágios incompletos, pulando demo CRM');
    return;
  }

  // -----------------------------------------------------------------------
  // 2. Customers (upsert by name+tenant)
  // -----------------------------------------------------------------------
  const customerDefs = [
    {
      name: 'Tech Corp Ltda',
      type: 'BUSINESS' as const,
      document: '12.345.678/0001-90',
      email: 'contato@techcorp.com.br',
      phone: '(11) 3000-1000',
      city: 'São Paulo',
      state: 'SP',
    },
    {
      name: 'Loja ABC',
      type: 'BUSINESS' as const,
      document: '98.765.432/0001-10',
      email: 'vendas@lojaabc.com.br',
      phone: '(21) 2500-2000',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
    {
      name: 'João Silva',
      type: 'INDIVIDUAL' as const,
      document: '123.456.789-00',
      email: 'joao.silva@email.com',
      phone: '(11) 99000-1111',
      city: 'São Paulo',
      state: 'SP',
    },
    {
      name: 'Maria Santos',
      type: 'INDIVIDUAL' as const,
      document: '987.654.321-00',
      email: 'maria.santos@email.com',
      phone: '(31) 99000-2222',
      city: 'Belo Horizonte',
      state: 'MG',
    },
    {
      name: 'Indústria XYZ S.A.',
      type: 'BUSINESS' as const,
      document: '11.222.333/0001-44',
      email: 'contato@industriaxyz.com.br',
      phone: '(31) 3100-3000',
      city: 'Belo Horizonte',
      state: 'MG',
    },
  ];

  const customers: Record<string, string> = {};
  let createdCustomers = 0;

  for (const def of customerDefs) {
    const existing = await prisma.customer.findFirst({
      where: { tenantId, name: def.name, deletedAt: null },
    });

    if (existing) {
      customers[def.name] = existing.id;
      continue;
    }

    const customer = await prisma.customer.create({
      data: {
        tenantId,
        name: def.name,
        type: def.type,
        document: def.document,
        email: def.email,
        phone: def.phone,
        city: def.city,
        state: def.state,
        isActive: true,
        source: 'MANUAL',
      },
    });

    customers[def.name] = customer.id;
    createdCustomers++;
  }

  console.log(
    createdCustomers > 0
      ? `   ✅ ${createdCustomers} clientes criados`
      : '   ✅ Clientes já existiam',
  );

  // -----------------------------------------------------------------------
  // 3. Contacts (check existence by firstName+customerId)
  // -----------------------------------------------------------------------
  interface ContactDef {
    customerName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: 'DECISION_MAKER' | 'GATEKEEPER' | 'INFLUENCER' | 'OTHER';
    lifecycle: 'SUBSCRIBER' | 'LEAD' | 'QUALIFIED' | 'OPPORTUNITY' | 'CUSTOMER';
    jobTitle: string;
    isMain: boolean;
  }

  const contactDefs: ContactDef[] = [
    // Tech Corp
    {
      customerName: 'Tech Corp Ltda',
      firstName: 'Pedro',
      lastName: 'Diretor',
      email: 'pedro@techcorp.com.br',
      phone: '(11) 99100-0001',
      role: 'DECISION_MAKER',
      lifecycle: 'QUALIFIED',
      jobTitle: 'Diretor Comercial',
      isMain: true,
    },
    {
      customerName: 'Tech Corp Ltda',
      firstName: 'Ana',
      lastName: 'Compras',
      email: 'ana@techcorp.com.br',
      phone: '(11) 99100-0002',
      role: 'GATEKEEPER',
      lifecycle: 'LEAD',
      jobTitle: 'Coordenadora de Compras',
      isMain: false,
    },
    // Loja ABC
    {
      customerName: 'Loja ABC',
      firstName: 'Carlos',
      lastName: 'Gerente',
      email: 'carlos@lojaabc.com.br',
      phone: '(21) 99200-0001',
      role: 'DECISION_MAKER',
      lifecycle: 'OPPORTUNITY',
      jobTitle: 'Gerente Geral',
      isMain: true,
    },
    // João Silva (auto main)
    {
      customerName: 'João Silva',
      firstName: 'João',
      lastName: 'Silva',
      email: 'joao.silva@email.com',
      phone: '(11) 99000-1111',
      role: 'OTHER',
      lifecycle: 'CUSTOMER',
      jobTitle: '',
      isMain: true,
    },
    // Maria Santos (auto main)
    {
      customerName: 'Maria Santos',
      firstName: 'Maria',
      lastName: 'Santos',
      email: 'maria.santos@email.com',
      phone: '(31) 99000-2222',
      role: 'OTHER',
      lifecycle: 'LEAD',
      jobTitle: '',
      isMain: true,
    },
    // Indústria XYZ
    {
      customerName: 'Indústria XYZ S.A.',
      firstName: 'Roberto',
      lastName: 'CEO',
      email: 'roberto@industriaxyz.com.br',
      phone: '(31) 99300-0001',
      role: 'DECISION_MAKER',
      lifecycle: 'QUALIFIED',
      jobTitle: 'CEO',
      isMain: true,
    },
    {
      customerName: 'Indústria XYZ S.A.',
      firstName: 'Fernanda',
      lastName: 'TI',
      email: 'fernanda@industriaxyz.com.br',
      phone: '(31) 99300-0002',
      role: 'INFLUENCER',
      lifecycle: 'LEAD',
      jobTitle: 'Gerente de TI',
      isMain: false,
    },
    {
      customerName: 'Indústria XYZ S.A.',
      firstName: 'Lucas',
      lastName: 'Financeiro',
      email: 'lucas@industriaxyz.com.br',
      phone: '(31) 99300-0003',
      role: 'GATEKEEPER',
      lifecycle: 'SUBSCRIBER',
      jobTitle: 'Analista Financeiro',
      isMain: false,
    },
  ];

  // Map contactFirstName -> contactId for deal linking
  const contacts: Record<string, string> = {};
  let createdContacts = 0;

  for (const def of contactDefs) {
    const customerId = customers[def.customerName];
    if (!customerId) continue;

    const existing = await prisma.crmContact.findFirst({
      where: {
        tenantId,
        customerId,
        firstName: def.firstName,
        lastName: def.lastName,
        deletedAt: null,
      },
    });

    if (existing) {
      contacts[def.firstName] = existing.id;
      continue;
    }

    const contact = await prisma.crmContact.create({
      data: {
        tenantId,
        customerId,
        firstName: def.firstName,
        lastName: def.lastName,
        fullName: `${def.firstName} ${def.lastName}`,
        email: def.email,
        phone: def.phone,
        role: def.role,
        lifecycleStage: def.lifecycle,
        jobTitle: def.jobTitle || null,
        isMainContact: def.isMain,
        source: 'MANUAL',
        tags: [],
      },
    });

    contacts[def.firstName] = contact.id;
    createdContacts++;
  }

  console.log(
    createdContacts > 0
      ? `   ✅ ${createdContacts} contatos criados`
      : '   ✅ Contatos já existiam',
  );

  // -----------------------------------------------------------------------
  // 4. Deals
  // -----------------------------------------------------------------------
  interface DealDef {
    title: string;
    customerName: string;
    contactFirstName: string;
    stageId: string;
    status: 'OPEN' | 'WON' | 'LOST';
    value: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    lostReason?: string;
    closedAt?: Date;
  }

  const now = new Date();

  const dealDefs: DealDef[] = [
    {
      title: 'ERP TechCorp',
      customerName: 'Tech Corp Ltda',
      contactFirstName: 'Pedro',
      stageId: negociacao,
      status: 'OPEN',
      value: 50000,
      priority: 'HIGH',
    },
    {
      title: 'Licença ABC',
      customerName: 'Loja ABC',
      contactFirstName: 'Carlos',
      stageId: proposta,
      status: 'OPEN',
      value: 15000,
      priority: 'MEDIUM',
    },
    {
      title: 'Consultoria XYZ',
      customerName: 'Indústria XYZ S.A.',
      contactFirstName: 'Roberto',
      stageId: qualificacao,
      status: 'OPEN',
      value: 32000,
      priority: 'HIGH',
    },
    {
      title: 'Suporte João',
      customerName: 'João Silva',
      contactFirstName: 'João',
      stageId: ganho,
      status: 'WON',
      value: 2500,
      priority: 'LOW',
      closedAt: new Date(now.getTime() - 7 * 86400000), // 7 days ago
    },
    {
      title: 'Projeto Maria',
      customerName: 'Maria Santos',
      contactFirstName: 'Maria',
      stageId: qualificacao,
      status: 'OPEN',
      value: 8000,
      priority: 'LOW',
    },
    {
      title: 'Expansão TechCorp',
      customerName: 'Tech Corp Ltda',
      contactFirstName: 'Ana',
      stageId: qualificacao,
      status: 'OPEN',
      value: 75000,
      priority: 'MEDIUM',
    },
    {
      title: 'Migração Loja ABC',
      customerName: 'Loja ABC',
      contactFirstName: 'Carlos',
      stageId: perdido,
      status: 'LOST',
      value: 12000,
      priority: 'MEDIUM',
      lostReason: 'Preço alto',
      closedAt: new Date(now.getTime() - 14 * 86400000), // 14 days ago
    },
    {
      title: 'Treinamento XYZ',
      customerName: 'Indústria XYZ S.A.',
      contactFirstName: 'Fernanda',
      stageId: proposta,
      status: 'OPEN',
      value: 5000,
      priority: 'MEDIUM',
    },
  ];

  const deals: Record<string, string> = {};
  let createdDeals = 0;

  for (const [idx, def] of dealDefs.entries()) {
    const customerId = customers[def.customerName];
    const contactId = contacts[def.contactFirstName] ?? null;
    if (!customerId) continue;

    const existing = await prisma.crmDeal.findFirst({
      where: { tenantId, title: def.title, deletedAt: null },
    });

    if (existing) {
      deals[def.title] = existing.id;
      continue;
    }

    const deal = await prisma.crmDeal.create({
      data: {
        tenantId,
        title: def.title,
        customerId,
        contactId,
        pipelineId: pipeline.id,
        stageId: def.stageId,
        status: def.status,
        priority: def.priority,
        value: def.value,
        currency: 'BRL',
        lostReason: def.lostReason ?? null,
        closedAt: def.closedAt ?? null,
        position: idx,
        assignedToUserId: adminUser.id,
        source: 'MANUAL',
      },
    });

    deals[def.title] = deal.id;
    createdDeals++;
  }

  console.log(
    createdDeals > 0
      ? `   ✅ ${createdDeals} deals criados`
      : '   ✅ Deals já existiam',
  );

  // -----------------------------------------------------------------------
  // 5. Activities (15 total across deals)
  // -----------------------------------------------------------------------
  interface ActivityDef {
    dealTitle: string;
    contactFirstName: string;
    type: 'NOTE' | 'CALL' | 'MEETING' | 'TASK' | 'FOLLOW_UP';
    title: string;
    description: string;
    status: 'PLANNED' | 'COMPLETED' | 'IN_PROGRESS';
    dueDate?: Date;
    completedAt?: Date;
    duration?: number;
  }

  const futureDays = (d: number) => new Date(now.getTime() + d * 86400000);
  const pastDays = (d: number) => new Date(now.getTime() - d * 86400000);

  const activityDefs: ActivityDef[] = [
    // ERP TechCorp
    {
      dealTitle: 'ERP TechCorp',
      contactFirstName: 'Pedro',
      type: 'NOTE',
      title: 'Reunião inicial com TechCorp',
      description:
        'Cliente interessado em módulos de estoque e financeiro. Pediu proposta detalhada.',
      status: 'COMPLETED',
      completedAt: pastDays(5),
    },
    {
      dealTitle: 'ERP TechCorp',
      contactFirstName: 'Pedro',
      type: 'CALL',
      title: 'Follow-up proposta TechCorp',
      description: 'Ligar para Pedro para discutir termos da proposta.',
      status: 'PLANNED',
      dueDate: futureDays(2),
    },
    {
      dealTitle: 'ERP TechCorp',
      contactFirstName: 'Ana',
      type: 'MEETING',
      title: 'Apresentação técnica para equipe de TI',
      description:
        'Demonstrar integração com sistema atual. Ana vai organizar a sala.',
      status: 'PLANNED',
      dueDate: futureDays(5),
      duration: 120,
    },
    // Licença ABC
    {
      dealTitle: 'Licença ABC',
      contactFirstName: 'Carlos',
      type: 'CALL',
      title: 'Ligar para Carlos sobre proposta',
      description: 'Verificar se recebeu a proposta e esclarecer dúvidas.',
      status: 'COMPLETED',
      completedAt: pastDays(3),
      duration: 15,
    },
    {
      dealTitle: 'Licença ABC',
      contactFirstName: 'Carlos',
      type: 'TASK',
      title: 'Preparar contrato Loja ABC',
      description: 'Elaborar contrato de licenciamento com condições negociadas.',
      status: 'PLANNED',
      dueDate: futureDays(3),
    },
    // Consultoria XYZ
    {
      dealTitle: 'Consultoria XYZ',
      contactFirstName: 'Roberto',
      type: 'MEETING',
      title: 'Visita à Indústria XYZ',
      description:
        'Visita presencial para entender processos produtivos e levantar requisitos.',
      status: 'COMPLETED',
      completedAt: pastDays(10),
      duration: 180,
    },
    {
      dealTitle: 'Consultoria XYZ',
      contactFirstName: 'Fernanda',
      type: 'NOTE',
      title: 'Requisitos técnicos levantados',
      description:
        'Fernanda enviou documento com requisitos de integração com ERP legado.',
      status: 'COMPLETED',
      completedAt: pastDays(8),
    },
    {
      dealTitle: 'Consultoria XYZ',
      contactFirstName: 'Roberto',
      type: 'TASK',
      title: 'Enviar proposta de consultoria',
      description: 'Montar proposta com escopo, cronograma e valores.',
      status: 'IN_PROGRESS',
      dueDate: futureDays(1),
    },
    // Suporte João (WON)
    {
      dealTitle: 'Suporte João',
      contactFirstName: 'João',
      type: 'CALL',
      title: 'Fechamento com João',
      description: 'João confirmou interesse e aprovou o valor.',
      status: 'COMPLETED',
      completedAt: pastDays(7),
      duration: 10,
    },
    // Projeto Maria
    {
      dealTitle: 'Projeto Maria',
      contactFirstName: 'Maria',
      type: 'NOTE',
      title: 'Primeiro contato com Maria',
      description: 'Maria conheceu o sistema por indicação. Interesse inicial.',
      status: 'COMPLETED',
      completedAt: pastDays(2),
    },
    {
      dealTitle: 'Projeto Maria',
      contactFirstName: 'Maria',
      type: 'FOLLOW_UP',
      title: 'Agendar demo para Maria',
      description: 'Entrar em contato para agendar uma demonstração do sistema.',
      status: 'PLANNED',
      dueDate: futureDays(4),
    },
    // Expansão TechCorp
    {
      dealTitle: 'Expansão TechCorp',
      contactFirstName: 'Ana',
      type: 'NOTE',
      title: 'Identificação de oportunidade de expansão',
      description:
        'Ana mencionou que a TechCorp está abrindo filial e precisa de mais licenças.',
      status: 'COMPLETED',
      completedAt: pastDays(1),
    },
    // Migração Loja ABC (LOST)
    {
      dealTitle: 'Migração Loja ABC',
      contactFirstName: 'Carlos',
      type: 'NOTE',
      title: 'Deal perdido - preço',
      description:
        'Carlos informou que optaram por solução mais barata. Manter relacionamento.',
      status: 'COMPLETED',
      completedAt: pastDays(14),
    },
    // Treinamento XYZ
    {
      dealTitle: 'Treinamento XYZ',
      contactFirstName: 'Fernanda',
      type: 'MEETING',
      title: 'Reunião de alinhamento treinamento',
      description: 'Definir escopo e datas do treinamento com equipe de TI.',
      status: 'PLANNED',
      dueDate: futureDays(7),
      duration: 60,
    },
    {
      dealTitle: 'Treinamento XYZ',
      contactFirstName: 'Lucas',
      type: 'TASK',
      title: 'Enviar orçamento treinamento',
      description: 'Lucas solicitou orçamento detalhado para aprovação financeira.',
      status: 'PLANNED',
      dueDate: futureDays(2),
    },
  ];

  let createdActivities = 0;

  for (const def of activityDefs) {
    const dealId = deals[def.dealTitle];
    const contactId = contacts[def.contactFirstName] ?? null;
    if (!dealId) continue;

    // Check existence by title+deal
    const existing = await prisma.crmActivity.findFirst({
      where: { tenantId, dealId, title: def.title, deletedAt: null },
    });

    if (existing) continue;

    await prisma.crmActivity.create({
      data: {
        tenantId,
        dealId,
        contactId,
        type: def.type,
        title: def.title,
        description: def.description,
        status: def.status,
        dueDate: def.dueDate ?? null,
        completedAt: def.completedAt ?? null,
        duration: def.duration ?? null,
        userId: adminUser.id,
      },
    });

    createdActivities++;
  }

  console.log(
    createdActivities > 0
      ? `   ✅ ${createdActivities} atividades criadas`
      : '   ✅ Atividades já existiam',
  );

  console.log('   ✅ Dados demo de CRM criados com sucesso!');
}
