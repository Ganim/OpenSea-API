import { DocEntry } from '../../docs-registry';

export const toolsDocs: DocEntry[] = [
  {
    module: 'tools',
    feature: 'email',
    type: 'overview',
    keywords: [
      'email',
      'correio',
      'mensagem',
      'caixa',
      'entrada',
      'enviar',
      'imap',
      'smtp',
      'conta',
      'compartilhada',
    ],
    requiredPermissions: ['tools.email.accounts.access'],
    navPath: '/email',
    title: 'Visao Geral: Email',
    content: `A ferramenta de Email do OpenSea oferece um cliente de email completo integrado ao sistema, eliminando a necessidade de aplicativos externos para comunicacao corporativa.

**Funcionalidades principais:**
- **Contas de email**: Configure multiplas contas IMAP/SMTP (Gmail, Outlook, contas corporativas). Cada usuario pode ter suas proprias contas e tambem acessar contas compartilhadas da equipe.
- **Caixa de entrada**: Visualizacao de emails recebidos com busca por remetente, assunto ou conteudo. Suporte a pastas/labels conforme o servidor IMAP.
- **Composicao**: Editor de email com formatacao rica, anexos, CC/BCC e assinatura personalizada.
- **Pastas**: Navegacao por pastas do servidor (Caixa de Entrada, Enviados, Rascunhos, Lixeira, Spam) e pastas personalizadas.
- **Sincronizacao em tempo real**: O sistema utiliza IMAP IDLE para receber notificacoes instantaneas de novos emails sem necessidade de refresh manual.
- **Contas compartilhadas**: Contas de email podem ser compartilhadas entre membros da equipe, permitindo que multiplos usuarios gerenciem a mesma caixa postal (ex: suporte@empresa.com, comercial@empresa.com).
- **Assinatura**: Cada usuario pode configurar uma assinatura HTML personalizada que sera adicionada automaticamente aos emails enviados.

**Configuracao de conta:**
1. Acesse Ferramentas > Email no menu lateral.
2. Clique em "Adicionar Conta".
3. Informe o email, senha (ou senha de app para Gmail/Outlook), servidor IMAP, porta IMAP, servidor SMTP e porta SMTP.
4. O sistema testa a conexao automaticamente antes de salvar.
5. Apos configurar, os emails serao sincronizados.

**Permissoes:**
- "tools.email.accounts.access": Visualizar contas de email.
- "tools.email.accounts.share": Compartilhar contas com outros usuarios.
- "tools.email.messages.access": Ler emails.
- "tools.email.messages.register": Enviar emails.

**Limitacao:** A ferramenta depende de acesso IMAP/SMTP ao servidor de email. Provedores que nao suportam IMAP (apenas API proprietaria) podem nao ser compativeis.`,
  },
  {
    module: 'tools',
    feature: 'tasks',
    type: 'overview',
    keywords: [
      'tarefa',
      'kanban',
      'quadro',
      'card',
      'coluna',
      'board',
      'to-do',
      'atividade',
      'projeto',
    ],
    requiredPermissions: ['tools.tasks.boards.access'],
    navPath: '/tasks',
    title: 'Visao Geral: Tarefas (Kanban)',
    content: `A ferramenta de Tarefas oferece quadros Kanban para gestao visual de atividades e projetos da equipe.

**Funcionalidades principais:**
- **Quadros (Boards)**: Crie quadros para diferentes projetos, equipes ou fluxos de trabalho. Cada quadro possui colunas personalizaveis que representam etapas do processo.
- **Colunas**: Defina etapas como "A Fazer", "Em Andamento", "Em Revisao", "Concluido" (ou qualquer nome personalizado). Reordene colunas arrastando e soltando.
- **Cards (Tarefas)**: Cada card representa uma tarefa individual com titulo, descricao, responsavel, data de vencimento, labels (etiquetas coloridas), checklist, subtarefas e anexos.
- **Drag-and-Drop**: Mova cards entre colunas arrastando e soltando. A posicao e atualizada em tempo real para todos os membros do quadro.
- **Membros**: Convide membros da equipe para colaborar no quadro. Atribua responsaveis a cards especificos.
- **Labels**: Etiquetas coloridas para categorizar tarefas (ex: "Urgente", "Bug", "Melhoria", "Design").
- **Checklists e Subtarefas**: Divida tarefas complexas em itens menores com progresso visual.
- **Comentarios**: Comunicacao contextualizada dentro de cada card, com mencoes (@usuario) e historico.
- **Anexos**: Faca upload de arquivos diretamente nos cards.
- **Watchers**: Acompanhe cards sem ser responsavel, recebendo notificacoes de alteracoes.
- **Campos personalizados**: Adicione campos extras aos cards conforme necessidade do projeto.
- **Automacoes**: Configure regras automaticas (ex: mover card para "Concluido" ao marcar todos os itens do checklist).

**Como comecar:**
1. Acesse Ferramentas > Tarefas no menu lateral.
2. Clique em "Novo Quadro" e defina o nome e descricao.
3. Adicione colunas representando as etapas do seu fluxo.
4. Crie cards nas colunas e atribua membros.

**Permissoes:**
- "tools.tasks.boards.access": Visualizar quadros.
- "tools.tasks.boards.register": Criar quadros.
- "tools.tasks.cards.register": Criar cards.
- "tools.tasks.boards.share": Compartilhar quadros.`,
  },
  {
    module: 'tools',
    feature: 'calendar',
    type: 'overview',
    keywords: [
      'calendario',
      'evento',
      'agenda',
      'reuniao',
      'compromisso',
      'lembrete',
      'recorrencia',
      'ical',
    ],
    requiredPermissions: ['tools.calendar.access'],
    navPath: '/calendar',
    title: 'Visao Geral: Calendario',
    content: `A ferramenta de Calendario permite gerenciar eventos, reunioes e compromissos com suporte a recorrencia, participantes e lembretes.

**Funcionalidades principais:**
- **Calendarios multiplos**: Crie calendarios separados para diferentes finalidades (pessoal, equipe, projeto, ferias). Cada calendario tem cor propria para facil identificacao visual.
- **Eventos**: Crie eventos com titulo, descricao, data/hora inicio e fim, local (presencial ou link de videoconferencia) e cor personalizada.
- **Recorrencia (RRULE)**: Configure eventos recorrentes seguindo o padrao iCalendar RRULE:
  - Diario, semanal, mensal ou anual.
  - Dias especificos da semana (ex: toda segunda e quarta).
  - Limite por numero de ocorrencias ou data final.
  - Excecoes para datas especificas.
- **Participantes**: Convide outros usuarios do sistema para eventos. Cada participante pode aceitar, recusar ou marcar como "talvez".
- **Lembretes**: Configure notificacoes antes do evento (ex: 15 minutos, 1 hora, 1 dia antes). Lembretes sao enviados como notificacao no sistema.
- **Visualizacoes**: Alterne entre visualizacao de dia, semana e mes. Arraste e solte eventos para reagendar rapidamente.
- **Exportacao iCal**: Exporte eventos no formato .ics para integracao com Google Calendar, Outlook ou Apple Calendar.
- **Eventos de dia inteiro**: Marque eventos que ocupam o dia todo (ex: feriados, ferias, viagens).

**Como comecar:**
1. Acesse Ferramentas > Calendario no menu lateral.
2. A visualizacao padrao exibe o mes atual com todos os eventos.
3. Clique em uma data para criar um novo evento ou arraste para definir o periodo.
4. Preencha os detalhes e salve.

**Permissoes:**
- "tools.calendar.access": Visualizar calendarios e eventos.
- "tools.calendar.register": Criar eventos.
- "tools.calendar.share": Compartilhar calendarios com outros usuarios.
- "tools.calendar.export": Exportar eventos em formato iCal.`,
  },
  {
    module: 'tools',
    feature: 'storage',
    type: 'overview',
    keywords: [
      'arquivo',
      'armazenamento',
      'pasta',
      'upload',
      'download',
      'documento',
      's3',
      'compartilhar',
      'gerenciador',
    ],
    requiredPermissions: ['tools.storage.files.access'],
    navPath: '/file-manager',
    title: 'Visao Geral: Gerenciador de Arquivos',
    content: `O Gerenciador de Arquivos oferece armazenamento e organizacao de documentos na nuvem, com estrutura de pastas, compartilhamento e controle de acesso.

**Funcionalidades principais:**
- **Pastas**: Organize arquivos em pastas e subpastas, similar a um explorador de arquivos. Crie estruturas hierarquicas para departamentos, projetos ou categorias.
- **Upload de arquivos**: Faca upload de documentos, imagens, planilhas, PDFs e outros tipos de arquivo. Suporte a upload multiplo e drag-and-drop.
- **Download**: Baixe arquivos individuais ou pastas inteiras compactadas em ZIP.
- **Visualizacao**: Pre-visualize imagens e PDFs diretamente no navegador sem necessidade de download. Thumbnails sao gerados automaticamente para imagens.
- **Compartilhamento**: Compartilhe arquivos ou pastas com outros usuarios do tenant, definindo permissoes (visualizar, editar, gerenciar).
- **Links publicos**: Gere links de acesso publico para compartilhar arquivos com pessoas externas ao sistema, com opcao de protecao por senha e data de expiracao.
- **Lixeira**: Arquivos excluidos vao para a lixeira e podem ser restaurados dentro de 30 dias. Apos esse periodo, sao removidos permanentemente.
- **Armazenamento S3**: Os arquivos sao armazenados em buckets Amazon S3 (ou compativel), garantindo durabilidade, disponibilidade e escalabilidade.
- **Seguranca**: Controle de acesso por permissoes RBAC. Arquivos sensiviveis podem ter acesso restrito a usuarios ou grupos especificos.
- **Administracao**: Painel administrativo para monitorar uso de espaco, gerenciar cotas por usuario e configurar politicas de retencao.

**Como comecar:**
1. Acesse Ferramentas > Gerenciador de Arquivos no menu lateral.
2. Navegue pela estrutura de pastas ou crie novas pastas.
3. Arraste arquivos do seu computador para a area de upload ou clique em "Upload".
4. Para compartilhar, clique com botao direito no arquivo e selecione "Compartilhar".

**Permissoes:**
- "tools.storage.files.access": Visualizar arquivos.
- "tools.storage.files.register": Fazer upload de arquivos.
- "tools.storage.folders.register": Criar pastas.
- "tools.storage.files.share": Compartilhar arquivos e pastas.
- "tools.storage.files.admin": Gerenciar todos os arquivos do tenant.`,
  },
];
