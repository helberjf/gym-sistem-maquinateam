# Setup Seed

Guia canonico para preparar o banco e executar o seed deste projeto.

## Objetivo

O arquivo [`prisma/seed.ts`](/c:/Users/default.LAPTOP-K8F2QHAF/projects/gym-system-mercadopago-express-vercel-JS/prisma/seed.ts) limpa os dados atuais e recria um ambiente completo de demonstracao da Maquina Team.

Ele popula:

- usuarios, perfis de aluno e professor
- modalidades, turmas e matriculas
- 11 planos publicos da grade real da academia
- assinaturas e pagamentos
- produtos, imagens, wishlist, cupom, carrinho e pedido online
- templates e atribuicoes de treino
- avisos e logs de auditoria

## Pre-requisitos

- Node.js 18+ e npm
- PostgreSQL acessivel
- arquivo `.env.local` preenchido

## Variaveis obrigatorias para o seed

As duas variaveis abaixo sao obrigatorias:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maquinateam?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/maquinateam?schema=public"
```

Regra pratica:

- `DATABASE_URL`: URL usada pela aplicacao
- `DIRECT_URL`: URL direta usada por migrations e pelo seed quando o banco usa pooler

Se estiver usando Supabase:

- `DATABASE_URL` pode apontar para o pooler
- `DIRECT_URL` deve apontar para a conexao direta da porta `5432`

## Variaveis opcionais, mas recomendadas

```env
SEED_ADMIN_PASSWORD="Admin@123"
SEED_STAFF_PASSWORD="Equipe@123"
SEED_STUDENT_PASSWORD="Aluno@123"
```

Se nao forem definidas, esses mesmos valores padrao serao usados.

Importante:

- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `MP_ACCESS_TOKEN` e `ABACATEPAY_API_KEY` nao sao necessarios para executar o seed
- essas credenciais so sao necessarias para testar login social e pagamentos reais depois

## Ordem correta para preparar o banco

### 1. Instalar dependencias

```bash
npm install
```

### 2. Aplicar o schema

Ambiente local com banco proprio:

```bash
npm run db:migrate
```

Ambiente remoto ja provisionado:

```bash
npm run db:migrate:deploy
```

Se voce estiver apenas sincronizando um banco temporario e souber o que esta fazendo, pode usar:

```bash
npm run db:push
```

## Executando o seed

Fluxo padrao:

```bash
npm run db:seed
```

Se estiver usando Supabase, Neon ou qualquer setup com pooler e o seed falhar por conexao/transacao, rode:

```bash
npm run db:seed:direct
```

## Reset completo do ambiente

Para apagar tudo, reaplicar o schema e rodar o seed do zero:

```bash
npm run db:reset
```

Atencao:

- esse comando apaga todos os dados do banco apontado por `DATABASE_URL`
- nunca rode isso em producao

## Como verificar se funcionou

### 1. Abrir Prisma Studio

```bash
npm run db:studio
```

### 2. Conferir os principais registros

Voce deve encontrar pelo menos:

- `6` usuarios
- `4` modalidades
- `4` turmas
- `4` matriculas
- `11` planos
- `3` assinaturas
- `4` pagamentos
- `9` produtos
- `1` wishlist
- `1` cupom
- `1` pedido online
- `5` templates de treino
- `3` atribuicoes de treino
- `3` avisos
- `6` logs de auditoria

## Usuarios criados

### Admin

- email: `admin@maquinateam.com.br`
- senha: `SEED_ADMIN_PASSWORD` ou `Admin@123`

### Equipe

- `recepcao@maquinateam.com.br`
- `ricardo.alves@maquinateam.com.br`
- senha: `SEED_STAFF_PASSWORD` ou `Equipe@123`

### Alunos

- `alice.nogueira@maquinateam.com.br`
- `bruno.tavares@maquinateam.com.br`
- `camila.rocha@maquinateam.com.br`
- senha: `SEED_STUDENT_PASSWORD` ou `Aluno@123`

## Planos criados pelo seed

Os planos publicos sao os mesmos da grade usada como referencia:

- Mensal 1x na Semana
- Mensal 2x na Semana
- Mensal 3x na Semana
- Semestral 1x na Semana
- Semestral 2x na Semana
- Semestral 3x na Semana
- Anual 1x na Semana
- Anual 2x na Semana
- Anual 3x na Semana
- Plano Full
- Plano Full Desconto Social

## Dados de loja criados

O seed tambem deixa a loja pronta para teste:

- catalogo com 9 produtos
- imagens de produto locais em `/public/images`
- wishlist da Alice com 3 itens
- cupom `BEMVINDO10`
- endereco salvo
- pedido online de exemplo
- vendas presenciais registradas

## Comandos uteis

```bash
npm run db:generate
npm run db:format
npm run db:status
npm run db:studio
npm run db:seed
npm run db:seed:direct
npm run db:reset
```

## Troubleshooting

### Erro de tabela inexistente

As migrations ainda nao foram aplicadas. Rode:

```bash
npm run db:migrate
```

ou:

```bash
npm run db:migrate:deploy
```

### Erro de conexao com banco

Verifique:

- se `DATABASE_URL` e `DIRECT_URL` apontam para o banco correto
- se o Postgres esta ativo
- se firewall, VPN ou pooler nao estao bloqueando a conexao

### Seed falha em banco com pooler

Rode:

```bash
npm run db:seed:direct
```

### Checkout nao funciona depois do seed

Isso nao significa erro no seed.

O seed so cria dados locais. Para testar checkout real depois, configure:

- `MP_ACCESS_TOKEN`
- `ABACATEPAY_API_KEY`
- `NEXT_PUBLIC_APP_URL`
- `AUTH_SECRET`

## Resumo para outra LLM

Se outra LLM precisar reproduzir este ambiente, a sequencia correta e:

1. preencher `.env.local` com `DATABASE_URL` e `DIRECT_URL`
2. rodar `npm install`
3. rodar `npm run db:migrate` ou `npm run db:migrate:deploy`
4. rodar `npm run db:seed` ou `npm run db:seed:direct`
5. validar no Prisma Studio
