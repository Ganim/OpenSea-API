Aqui temos as instruções para criar/alterar um módulo:

Lembrando que:
- Neste projeto usamos DDD;
- Seguimos o principio de responsabilidade única dos arquivos (SOLID);
- Trabalhamos com clean-code;
- Todos os nomes devem ser semânticos e auto explicativos;
- Nenhuma variável deve ter nomes genéricos;

Você deve seguir os seguintes passos:
- Verificar nosso schema prisma e adequar ele;
- Criar/adequar as entidades e value objects conforme o padrão do projeto;
- Criar/adequar os Mappers e DTOs conforme o padrão do projeto;
- Criar/adequar os repositórios (Contrato, In-memory, prisma) conforme o padrão do projeto;
- Criar/adequar os casos de uso conforme o padrão do projeto;
- Criar/adequar os erros retornados pelo caso de uso (usamos nosso proprio erro-handler);
- Criar/adequar as factories de dados unicos e ficticios para serem usados nos testes unitários e e2e;
- Criar/adequar os testes unitários para cada casos de uso conforme o padrão do projeto (todos os casos de uso deve ter um teste);
- Criar/adequar as factories dos casos de uso conforme o padrão do projeto;
- Criar/adequar os presenters que serão retornados nos controllers;
- Criar/adequar os schemas que serão usados nos controllers;
- Criar/adequar a lista de permissões que serão usados nos controllers (atualizar a seed as permissoes necessárias);
- Criar/adequar os controllers dos casos de uso conforme o padrão do projeto;
- Criar/adequar os testes e2e para cada controller conforme o padrão do projeto (todos os controllers deve ter um teste);
- Criar/adequar as rotas dos casos de uso;

Fique atento em:
- Todos os testes e2e devem executar em ambiente isolado;
- No final execute o comando para verificar se todos os casos de uso possuem seus respectivos testes unitários;
- No final execute o comando para verificar se todos os testes unitários devem estar passando sem erros;
- No final execute o comando para verificar se todos os controllers possuem seus respectivos testes e2e;
- No final execute o comando para verificar se todos os testes unitários devem estar passando sem erros;
- Todos os testes devem usar factories para gerar dados dentro deles;
- Todas as ações devem gerar registro de auditoria;
- Toda a API deve estar documentada com o swagger;
- Se houve mudança no schema, se foi feita a migration e se a seed foi atualizada;
- No final deve ter um arquivo resumo atualizado que auxilie a implementação no front-end com os schemas de entrada e saida de dados, rotas, permissões localizado em /implement-guide/(pasta-do-sistema)/(nome-do-modulo).md;