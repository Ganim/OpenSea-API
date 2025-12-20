# Módulo de Funcionários

## Objetivo
Gerenciar o cadastro de funcionários

## Campos da Entidade

| Campo | Tipo | Obrigatório | Observações |
|-------|------|-------------|-------------|
| ID | UUID | Sim | - |
| Matrícula | String | Sim | Gerada automaticamente, unicidade compatível com soft-delete |
| Nome | String | Sim | - |
| CPF | String | Sim | Unicidade compatível com soft-delete |
| Gênero | String | Não | Gera pendência |
| Nascimento | Date | Não | Gera pendência |
| Carteira de Trabalho | File | Não | Requer anexo, gera pendência |
| Exame Adicional | File | Não | Requer anexo, gera pendência |
| Título de Reservista | File | Não | Requer anexo, gera pendência se masculino |
| Cargo | FK (Position) | Não | Gera pendência |
| Empresa | FK (Enterprise) | Não | Gera pendência |
| Telefone | String | Não | Gera pendência |
| Email | String | Não | Gera pendência |
| Endereço | String | Não | Requer comprovante, gera pendência |
| Contato de Emergência | JSON | Não | {nome, telefone, parentesco}, gera pendência |
| PCD | Boolean | Não | - |
| Enfermidades | JSON | Não | {descrição, requer_atenção} |
| Salário | Decimal | Não | Gera pendência |
| Data de Admissão | Date | Não | Gera pendência |
| Data de Demissão | Date | Não | Gera pendência |
| UserID | FK (User) | Não | - |
| Pendências | JSON | Sim | Lista de pendências |

## Cadastro

**Campos obrigatórios:**
- CPF (único)
- Nome

## Listagem

**Campos retornados:**
- Nome, Matrícula, Cargo, Empresa, CPF, Gênero, Nascimento, Telefone, Email, Contato de Emergência, UserID, Pendências, Criado em, Atualizado em

**Outros campos que temos que pensar em como integrar e retornar:**
- Quantidade de faltas do funcionário
- Quantidade de vales (adiantamentos)
- Quantidade de atestados
- Se possui doença que requer atenção

## Endpoints de Pesquisa

- Verificar existência de CPF
- Listar todos ativos
- Listar todos inclusive inativos
- Listar por cargo
- Listar por empresa

## Observações

- Dados não preenchidos geram pendência
- Soft-delete: unicidade apenas para entidades ativas

