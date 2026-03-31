# Guia de Setup do Supabase

Este projeto segue o mesmo padrao usado na referencia local para separar:

- `DATABASE_URL`: conexao usada pela aplicacao em runtime
- `DIRECT_URL`: conexao usada por schema, migrations e bootstrap

## 1. URLs esperadas

No Supabase, use:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[SENHA_URL_ENCODED]@aws-1-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&sslmode=require"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[SENHA_URL_ENCODED]@aws-1-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

Observacoes:

- a senha precisa estar URL-encoded
- `6543` fica para runtime
- `5432` fica para migrations e `db push`
- neste projeto o Prisma usa `directUrl = env("DIRECT_URL")`

## 2. Variaveis locais

Preencha `.env.local` com as duas URLs.

## 3. Comandos importantes

Gerar client:

```bash
npm run db:generate
```

Ver status das migrations usando `DIRECT_URL`:

```bash
npm run db:status
```

Aplicar migrations no Supabase:

```bash
npm run db:migrate:deploy
```

Bootstrap do schema sem migration, se necessario:

```bash
npm run db:push
```

Rodar seed usando `DIRECT_URL`:

```bash
npm run db:seed:direct
```

## 4. Vercel

No projeto da Vercel, configure no minimo:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`

Sem `DATABASE_URL` valido em Production/Preview, rotas publicas que consultam a loja como `/loja` vao falhar em runtime.

## 5. Importante sobre seed

O `prisma/seed.ts` deste projeto e destrutivo para setup inicial: ele limpa tabelas antes de recriar os dados base.

Nao rode seed em banco com dados reais sem revisar antes.
