import { DocEntry } from '../../docs-registry';

export const hrDocs: DocEntry[] = [
  {
    module: 'hr',
    feature: 'visao-geral',
    type: 'overview',
    keywords: [
      'rh',
      'recursos humanos',
      'funcionarios',
      'departamentos',
      'folha',
      'ferias',
      'ponto',
      'escalas',
    ],
    requiredPermissions: ['hr.employees.access'],
    navPath: '/hr',
    title: 'Visao Geral do Modulo de RH',
    content: `O modulo de Recursos Humanos (RH) do OpenSea oferece gestao completa do ciclo de vida dos colaboradores da empresa. Ele abrange desde o cadastro inicial de funcionarios ate o controle de ponto, folha de pagamento, ferias, afastamentos e desligamentos.

Principais funcionalidades:
- **Funcionarios**: Cadastro completo com dados pessoais, documentos (CPF, RG, CTPS), dependentes, endereco e foto. Cada funcionario pode ser vinculado a um cargo e departamento.
- **Departamentos**: Estrutura organizacional da empresa com hierarquia e responsaveis.
- **Cargos**: Definicao de posicoes com nivel salarial e atribuicoes.
- **Escalas de Trabalho**: Configuracao de turnos, horarios e jornadas (CLT 44h, 12x36, personalizadas).
- **Controle de Ponto**: Registro de entradas e saidas com suporte a geofencing e ponto mobile (PWA).
- **Ferias**: Gestao de periodos aquisitivos, agendamento, fracionamento (ate 3 periodos conforme CLT) e abono pecuniario.
- **Afastamentos**: Registro de licencas medicas, maternidade/paternidade, e demais afastamentos legais.
- **Folha de Pagamento**: Calculo automatizado com proventos, descontos (INSS, IRRF, VT, VR), bonificacoes e horas extras.
- **Banco de Horas**: Controle de saldo positivo e negativo de horas trabalhadas.
- **Exames Medicos**: Agendamento e acompanhamento de ASO, admissional, periodico e demissional.
- **CIPA e Seguranca**: Gestao de mandatos CIPA, programas de seguranca (PPRA, PCMSO) e riscos no ambiente de trabalho.
- **eSocial**: Integracao com eventos do eSocial para conformidade legal.
- **Desligamentos**: Processo de rescisao com calculo de verbas rescisorias.

Navegacao: Acesse pelo menu lateral em "RH". A pagina principal exibe cards de navegacao para cada sub-modulo.`,
  },
  {
    module: 'hr',
    feature: 'cadastro-funcionario',
    type: 'guide',
    keywords: [
      'cadastrar',
      'funcionario',
      'novo',
      'colaborador',
      'admissao',
      'contratar',
      'registrar',
    ],
    requiredPermissions: ['hr.employees.register'],
    navPath: '/hr/employees',
    title: 'Guia: Cadastrar Funcionario',
    content: `Para cadastrar um novo funcionario no sistema, siga os passos abaixo:

1. **Acesse o modulo de RH** pelo menu lateral e clique em "Funcionarios".
2. **Clique no botao "Novo Funcionario"** no canto superior direito da listagem.
3. **Preencha os dados pessoais**: Nome completo, CPF (validado automaticamente), data de nascimento, sexo, estado civil, nacionalidade e naturalidade.
4. **Documentos**: Informe RG, orgao emissor, CTPS (numero e serie), PIS/PASEP e titulo de eleitor quando aplicavel.
5. **Endereco**: Preencha CEP (busca automatica), logradouro, numero, complemento, bairro, cidade e estado.
6. **Dados profissionais**: Selecione o departamento, cargo, escala de trabalho, data de admissao e tipo de contrato (CLT, PJ, estagio, temporario).
7. **Salario**: Informe a remuneracao base e eventuais adicionais (insalubridade, periculosidade, noturno).
8. **Dependentes** (opcional): Adicione dependentes para fins de IRRF e beneficios.
9. **Foto** (opcional): Faca upload da foto do colaborador.
10. **Salve o cadastro**.

Apos o cadastro, o sistema gera automaticamente o primeiro periodo aquisitivo de ferias e disponibiliza o funcionario para registro de ponto.

Importante: O CPF e validado em tempo real. Caso ja exista um funcionario ativo com o mesmo CPF no tenant, o sistema impedira o cadastro duplicado.

Tambem e possivel criar um funcionario ja vinculado a um usuario do sistema (com acesso ao OpenSea) marcando a opcao "Criar usuario" durante o cadastro.`,
  },
  {
    module: 'hr',
    feature: 'departamentos',
    type: 'guide',
    keywords: [
      'departamento',
      'setor',
      'area',
      'criar',
      'organograma',
      'estrutura',
    ],
    requiredPermissions: ['hr.departments.access'],
    navPath: '/hr/departments',
    title: 'Guia: Gerenciar Departamentos',
    content: `O modulo de Departamentos permite organizar a estrutura da empresa em areas funcionais. Cada departamento pode ter um responsavel e funcionarios vinculados.

**Criar um departamento:**
1. Acesse RH > Departamentos.
2. Clique em "Novo Departamento".
3. Informe o nome do departamento (ex: "Financeiro", "Comercial", "TI").
4. Opcionalmente, selecione um responsavel (deve ser um funcionario ja cadastrado).
5. Adicione uma descricao sobre as atribuicoes do setor.
6. Salve.

**Editar um departamento:**
1. Na listagem, clique no departamento desejado para abrir os detalhes.
2. Clique em "Editar" na barra de acoes.
3. Altere os campos necessarios e salve.

**Excluir um departamento:**
- Na pagina de edicao, clique em "Excluir" na barra de acoes.
- A exclusao requer confirmacao por PIN de seguranca.
- Departamentos com funcionarios vinculados nao podem ser excluidos. Remaneje os funcionarios antes.

**Boas praticas:**
- Mantenha nomes padronizados e consistentes.
- Sempre atribua um responsavel para facilitar a comunicacao interna.
- Use a listagem com filtros para localizar departamentos rapidamente.
- Departamentos sao utilizados em relatorios de folha de pagamento e controle de ponto, entao mantenha-os atualizados.`,
  },
  {
    module: 'hr',
    feature: 'escalas-trabalho',
    type: 'guide',
    keywords: [
      'escala',
      'turno',
      'jornada',
      'horario',
      'trabalho',
      'clt',
      '12x36',
      'folga',
    ],
    requiredPermissions: ['hr.work-schedules.access'],
    navPath: '/hr/work-schedules',
    title: 'Guia: Escalas de Trabalho',
    content: `As Escalas de Trabalho definem os horarios e jornadas que os funcionarios devem cumprir. O sistema suporta diversos tipos de escala conforme a legislacao trabalhista brasileira.

**Tipos de escala disponiveis:**
- **CLT Padrao (44h)**: Segunda a sexta das 8h as 18h com 1h de almoco, sabado das 8h as 12h.
- **12x36**: Jornada de 12 horas seguidas com 36 horas de descanso.
- **6x1**: Seis dias de trabalho com uma folga semanal rotativa.
- **Personalizada**: Configuracao livre de dias e horarios.

**Criar uma escala:**
1. Acesse RH > Escalas de Trabalho.
2. Clique em "Nova Escala".
3. Informe o nome (ex: "Administrativo", "Producao Noturna").
4. Selecione o tipo de escala.
5. Configure os dias da semana com horario de entrada, saida e intervalo.
6. Defina a tolerancia de atraso (em minutos) para o controle de ponto.
7. Salve a escala.

**Vincular funcionarios:**
Ao cadastrar ou editar um funcionario, selecione a escala de trabalho no campo correspondente. A escala determina:
- Horarios esperados no controle de ponto.
- Calculo de horas extras e banco de horas.
- Validacao de conflitos de horario.

**Importante:**
- Alterar uma escala afeta todos os funcionarios vinculados a ela a partir da data da alteracao.
- Para mudancas individuais, crie uma nova escala especifica ou altere diretamente no cadastro do funcionario.
- O sistema valida a carga horaria semanal conforme os limites da CLT.`,
  },
  {
    module: 'hr',
    feature: 'ferias',
    type: 'guide',
    keywords: [
      'ferias',
      'agendar',
      'periodo',
      'aquisitivo',
      'fracionamento',
      'abono',
      'gozo',
    ],
    requiredPermissions: ['hr.vacations.access'],
    navPath: '/hr/vacations',
    title: 'Guia: Gestao de Ferias',
    content: `O modulo de Ferias gerencia todo o ciclo de ferias dos colaboradores, desde o periodo aquisitivo ate o gozo e pagamento.

**Periodos aquisitivos:**
- O sistema cria automaticamente os periodos aquisitivos a cada 12 meses de trabalho a partir da data de admissao.
- Cada periodo concede direito a 30 dias de ferias (podendo ser reduzido conforme faltas injustificadas, conforme CLT art. 130).

**Agendar ferias:**
1. Acesse RH > Ferias.
2. Localize o funcionario na listagem (use filtros por departamento, status ou nome).
3. Clique no periodo aquisitivo disponivel.
4. Clique em "Agendar Ferias".
5. Informe a data de inicio e a quantidade de dias.
6. Se desejar fracionar, adicione ate 3 periodos (conforme Reforma Trabalhista):
   - Um dos periodos deve ter no minimo 14 dias corridos.
   - Os demais nao podem ser inferiores a 5 dias corridos cada.
7. Marque se o funcionario deseja abono pecuniario (venda de ate 1/3 das ferias).
8. Confirme o agendamento.

**Cancelar ferias agendadas:**
- Ferias ja agendadas podem ser canceladas antes da data de inicio. Apos o inicio do gozo, nao e possivel cancelar.

**Concluir ferias:**
- O sistema marca automaticamente as ferias como concluidas apos o termino do periodo de gozo.

**Informacoes exibidas:**
- Saldo de dias disponiveis por periodo aquisitivo.
- Historico completo de ferias gozadas.
- Alertas para periodos proximos do vencimento (limite de 12 meses apos o periodo aquisitivo).`,
  },
  {
    module: 'hr',
    feature: 'folha-pagamento',
    type: 'guide',
    keywords: [
      'folha',
      'pagamento',
      'salario',
      'holerite',
      'calculo',
      'inss',
      'irrf',
      'proventos',
      'descontos',
    ],
    requiredPermissions: ['hr.payroll.access'],
    navPath: '/hr/payroll',
    title: 'Guia: Folha de Pagamento',
    content: `A Folha de Pagamento automatiza o calculo de remuneracao mensal dos funcionarios, incluindo proventos, descontos legais e beneficios.

**Fluxo da folha:**
1. **Criar folha**: Acesse RH > Folha de Pagamento e clique em "Nova Folha". Selecione o mes/ano de referencia e o tipo (mensal, adiantamento, 13o salario, ferias, rescisao).
2. **Calcular**: O sistema processa automaticamente todos os funcionarios ativos, considerando:
   - Salario base do cargo.
   - Horas extras e adicional noturno (importados do controle de ponto).
   - Bonificacoes e gratificacoes cadastradas.
   - Descontos de INSS (tabela progressiva vigente).
   - Desconto de IRRF (tabela vigente com deducao por dependente).
   - Vale-transporte (ate 6% do salario base).
   - Vale-refeicao/alimentacao conforme configuracao.
   - Faltas e atrasos (quando aplicavel).
3. **Revisar**: Confira os valores calculados por funcionario. E possivel ajustar manualmente itens pontuais antes da aprovacao.
4. **Aprovar**: A aprovacao trava os valores e gera os holerites individuais.
5. **Exportar**: Exporte a folha em PDF ou planilha para envio ao contador ou banco.

**Cancelamento:**
- Folhas aprovadas podem ser canceladas pelo administrador de RH, gerando estorno dos lancamentos.

**Importante:**
- O calculo utiliza as tabelas de INSS e IRRF configuradas no sistema. Mantenha-as atualizadas conforme legislacao vigente.
- Bonificacoes e deducoes avulsas devem ser cadastradas antes do calculo da folha do mes correspondente.`,
  },
  {
    module: 'hr',
    feature: 'conflito-escala',
    type: 'troubleshooting',
    keywords: [
      'conflito',
      'escala',
      'horario',
      'sobreposicao',
      'erro',
      'ponto',
      'turno',
    ],
    requiredPermissions: ['hr.work-schedules.access'],
    navPath: '/hr/work-schedules',
    title: 'Solucao de Problemas: Conflitos de Escala',
    content: `Se voce encontrar erros relacionados a conflitos de escala ou horario, siga as orientacoes abaixo.

**Problema: "Horario de entrada conflita com outra escala"**
- Isso ocorre quando um funcionario esta vinculado a uma escala cujos horarios se sobrepoem a outro registro. Verifique:
  1. Acesse o cadastro do funcionario em RH > Funcionarios > [nome].
  2. Confira a escala de trabalho atribuida.
  3. Se houver mudanca de turno recente, verifique se a escala anterior foi desvinculada corretamente.

**Problema: Ponto registrado fora do horario da escala**
- O controle de ponto valida os registros com base na escala vinculada ao funcionario. Se o ponto cai fora da tolerancia configurada:
  1. Verifique a tolerancia de atraso configurada na escala (RH > Escalas > [escala] > campo tolerancia).
  2. Aumente a tolerancia se necessario (ex: de 5 para 15 minutos).
  3. Para casos pontuais, o gestor pode ajustar o registro de ponto manualmente.

**Problema: Escala 12x36 nao calcula folgas corretamente**
- Confirme que o tipo da escala esta marcado como "12x36" e nao "Personalizada".
- O sistema alterna automaticamente dias de trabalho e folga. Se a alternancia parece errada, verifique a data base (primeiro dia de trabalho configurado).

**Problema: Nao consigo excluir uma escala**
- Escalas com funcionarios vinculados nao podem ser removidas. Remaneje todos os funcionarios para outra escala antes de tentar a exclusao.`,
  },
  {
    module: 'hr',
    feature: 'funcionario-ausente',
    type: 'troubleshooting',
    keywords: [
      'funcionario',
      'nao aparece',
      'sumiu',
      'ausente',
      'listagem',
      'filtro',
      'inativo',
    ],
    requiredPermissions: ['hr.employees.access'],
    navPath: '/hr/employees',
    title: 'Solucao de Problemas: Funcionario Nao Aparece',
    content: `Se um funcionario nao esta aparecendo na listagem ou em selecoes do sistema, verifique os pontos abaixo.

**Causa 1: Filtro de status ativo**
- A listagem de funcionarios exibe por padrao apenas funcionarios com status "Ativo". Se o colaborador foi desligado ou esta afastado, ele pode nao aparecer.
- Solucao: Altere o filtro de status para "Todos" ou selecione o status especifico (Afastado, Desligado, Ferias).

**Causa 2: Filtro de departamento**
- Se voce aplicou um filtro por departamento, o funcionario so aparecera se estiver vinculado ao departamento selecionado.
- Solucao: Remova o filtro de departamento ou selecione o departamento correto.

**Causa 3: Permissao "somente proprio"**
- Se sua conta possui a permissao "hr.employees.onlyself", voce so visualiza seu proprio registro.
- Solucao: Solicite ao administrador a permissao "hr.employees.access" completa.

**Causa 4: Funcionario de outro tenant**
- Em ambiente multi-tenant, cada empresa possui seus proprios funcionarios. Confirme que voce esta logado no tenant correto (verifique o nome da empresa no canto superior).

**Causa 5: Cadastro incompleto**
- Se o cadastro foi iniciado mas nao finalizado (ex: faltou salvar), o funcionario pode nao ter sido persistido. Tente cadastra-lo novamente.

**Se nenhuma das causas acima resolver:** Verifique se ha erros no console do navegador e entre em contato com o suporte tecnico.`,
  },
  {
    module: 'hr',
    feature: 'erros-ferias',
    type: 'troubleshooting',
    keywords: [
      'ferias',
      'erro',
      'agendar',
      'periodo',
      'vencido',
      'fracionamento',
      'dias',
      'minimo',
    ],
    requiredPermissions: ['hr.vacations.access'],
    navPath: '/hr/vacations',
    title: 'Solucao de Problemas: Erros em Ferias',
    content: `Erros comuns ao gerenciar ferias e como resolve-los.

**Erro: "Periodo aquisitivo nao encontrado"**
- O sistema cria periodos aquisitivos automaticamente com base na data de admissao. Se o periodo nao existe:
  1. Verifique se a data de admissao do funcionario esta correta (RH > Funcionarios > [nome] > Editar).
  2. Se a admissao foi alterada recentemente, o sistema pode levar ate a proxima sincronizacao para atualizar os periodos.

**Erro: "Saldo insuficiente de dias"**
- O funcionario ja utilizou todos os dias disponiveis no periodo aquisitivo selecionado.
- Verifique o saldo na tela de detalhes do periodo. Considere se houve abono pecuniario (que consome 10 dias do saldo).

**Erro: "Fracionamento invalido - periodo minimo de 14 dias"**
- A CLT exige que ao fracionar ferias em ate 3 periodos, pelo menos um deles tenha no minimo 14 dias corridos, e os demais nao sejam inferiores a 5 dias.
- Ajuste a quantidade de dias para cumprir os requisitos legais.

**Erro: "Nao e possivel cancelar ferias em andamento"**
- Ferias cujo periodo de gozo ja iniciou nao podem ser canceladas pelo sistema. Apenas ferias com status "Agendada" (data de inicio futura) permitem cancelamento.

**Erro: "Periodo aquisitivo vencido"**
- O funcionario tem um periodo aquisitivo cujo prazo de concessao (12 meses apos completar o aquisitivo) ja expirou. A empresa pode estar sujeita a multa. Agende as ferias imediatamente e consulte o departamento juridico.

**Dica:** Utilize os alertas do dashboard de RH para monitorar periodos proximos do vencimento e evitar passivos trabalhistas.`,
  },
  {
    module: 'hr',
    feature: 'limitacoes',
    type: 'limitation',
    keywords: [
      'limitacao',
      'nao suporta',
      'restricao',
      'limite',
      'rh',
      'recursos humanos',
    ],
    requiredPermissions: ['hr.employees.access'],
    navPath: '/hr',
    title: 'Limitacoes do Modulo de RH',
    content: `Limitacoes conhecidas do modulo de Recursos Humanos:

**Integracao eSocial:**
- A integracao com o eSocial esta implementada ate a Fase 3 (eventos de tabela e nao periodicos). Eventos periodicos (folha) e de SST estao em desenvolvimento. A transmissao direta ao governo requer certificado digital A1 configurado.

**Controle de Ponto:**
- O ponto mobile (PWA) depende de conexao com internet para transmissao em tempo real. Em caso de offline, o registro e armazenado localmente e sincronizado quando a conexao retornar, porem pode haver atraso.
- O geofencing requer que o dispositivo do funcionario tenha GPS habilitado e permissao de localizacao concedida ao navegador.

**Folha de Pagamento:**
- As tabelas de INSS e IRRF precisam ser atualizadas manualmente quando ha alteracao na legislacao. O sistema nao atualiza automaticamente.
- Calculos de PLR (Participacao nos Lucros) e stock options nao estao disponiveis nativamente.

**Ferias:**
- O calculo de ferias proporcionais em caso de rescisao e feito pelo modulo de desligamento, nao pelo modulo de ferias diretamente.
- Ferias coletivas requerem agendamento individual para cada funcionario do departamento.

**Importacao:**
- A importacao em massa de funcionarios suporta apenas formato CSV com codificacao UTF-8.
- Campos de data devem estar no formato YYYY-MM-DD.

**Limites de volume:**
- Listagens exibem ate 100 registros por carregamento (scroll infinito carrega mais conforme necessario).
- Relatorios com mais de 10.000 registros podem levar alguns segundos para gerar.`,
  },
];
