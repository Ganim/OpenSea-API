# Módulo de Empresas

## Objetivo
Gerenciar as empresas que fazem parte do nosso sistema

## Campos da Entidade

| Campo | Tipo | Obrigatório | Observações |
|-------|------|-------------|-------------|
| ID | UUID | Sim | - |
| Razão Social | String | Sim | - |
| CNPJ | String | Sim | Unicidade compatível com soft-delete |
| Regime Tributário | String | Não | Gera Pendência |
| Telefone | String | Não | Gera Pendência |
| Endereço | String | Não | Requer Anexo do comprovante de endereço; Gera Pendência |
| Logo | File | Não | Requer Anexo |


## Cadastro

**Campos obrigatórios:**
- CNPJ (Único)
- Razão Social

## Listagem

**Campos retornados:**
- Razão Social
- CNPJ
- Regime Tributário
- Telefone

**Outros campos que temos que pensar em como integrar e retornar:**
- Quantidade de funcionários ativos


## Endpoints de Pesquisa

- Pesquisar se CNPJ já existe
- Listar todos ativos
- Listar todos inclusive inativos

## Observações

- Dados não preenchidos geram pendência
- Soft-delete: unicidade apenas para entidades ativas

