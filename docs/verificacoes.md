# Checklist de Verificações — Auditoria de Projeto Next.js

> Template reutilizável gerado a partir da auditoria do sistema Maquina Team.
> Use como base para auditar qualquer projeto Next.js com App Router, Prisma e autenticação.

---

## Como usar

1. Copie este arquivo para o projeto que deseja auditar
2. Preencha cada item com `[x]` (ok), `[ ]` (pendente) ou `[!]` (problema encontrado)
3. Anote observações na linha de comentário abaixo de cada item
4. Execute os comandos de diagnóstico nas seções de terminal
5. Gere um relatório de prioridades com base nos itens `[!]`

---

## COMANDOS DE DIAGNÓSTICO RÁPIDO

Execute estes comandos antes de começar o checklist manual:

```bash
# 1. Rodar todos os testes
npm run test:run

# 2. Verificar erros de tipos TypeScript
npm run typecheck

# 3. Rodar lint
npm run lint

# 4. Contar arquivos de teste fora de node_modules
find . -not -path "*/node_modules/*" -name "*.test.*" | wc -l

# 5. Listar todas as rotas de API
find . -not -path "*/node_modules/*" -name "route.ts" | sort

# 6. Encontrar rotas sem autenticação
find src/app/api -name "route.ts" | while read f; do
  if ! grep -qE "requireApiPermission|requireApiRole|getOptionalSession" "$f"; then
    echo "SEM AUTH: $f"
  fi
done

# 7. Encontrar rotas sem rate limit
find src/app/api -name "route.ts" | while read f; do
  if ! grep -qE "enforceRateLimit|checkRateLimit" "$f"; then
    echo "SEM RATE LIMIT: $f"
  fi
done

# 8. Contar uso de TypeScript 'any'
grep -rn "\bany\b" src/ --include="*.ts" --include="*.tsx" | grep -v "//\|node_modules" | wc -l

# 9. Encontrar imagens sem alt
grep -rn "<Image" src/ --include="*.tsx" | grep -v "alt=" | grep -v "node_modules"

# 10. Contar tamanho dos arquivos de serviço
find . -not -path "*/node_modules/*" -name "service.ts" | xargs wc -l | sort -rn | head -10

# 11. Verificar TODO/FIXME no código
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"

# 12. Encontrar páginas públicas sem metadata
find . -not -path "*/node_modules/*" -name "page.tsx" -path "*/public/*" | while read f; do
  if ! grep -qE "generateMetadata|export const metadata" "$f"; then
    echo "SEM METADATA: $f"
  fi
done

# 13. Verificar console.log em produção
grep -rn "console\.log\|console\.warn\|console\.error" src/ --include="*.ts" --include="*.tsx" | grep -v "//\|node_modules\|test"

# 14. Checar loading.tsx e error.tsx existentes
find . -not -path "*/node_modules/*" \( -name "loading.tsx" -o -name "error.tsx" -o -name "not-found.tsx" \)
```

---

## 1. TESTES

### 1.1 Execução

- [ ] `npm run test:run` passa sem falhas
- [ ] `npm run typecheck` sem erros
- [ ] `npm run lint` sem erros ou warnings críticos
- [ ] Build de produção (`npm run build`) sem erros

### 1.2 Cobertura

- [ ] Cobertura de rotas de API > 70%
- [ ] Fluxos críticos de negócio têm testes (checkout, pagamento, autenticação)
- [ ] Lógica de domínio (services) tem testes unitários
- [ ] Webhooks de pagamento têm testes de deduplicação
- [ ] Rate limiting tem testes de bloqueio e headers
- [ ] RBAC/permissões têm testes por papel
- [ ] Validações de schema Zod têm testes de casos inválidos

### 1.3 Tipos de teste

- [ ] Testes unitários para services e validators
- [ ] Testes de integração para rotas de API (com mocks de DB)
- [ ] Testes E2E para fluxos críticos (Playwright ou Cypress):
  - [ ] Cadastro → verificação de email → login
  - [ ] Adicionar ao carrinho → checkout → confirmação
  - [ ] Pagamento Pix (polling de status)
  - [ ] Fluxo de admin (criar produto, atribuir plano)

### 1.4 Diagnóstico

```
Resultado npm run test:run:
  [ ] Test Files: _____ passed / _____ failed
  [ ] Tests:      _____ passed / _____ failed
  [ ] Duração:    _____

Cobertura estimada: _____% das rotas de API
```

---

## 2. SEGURANÇA

### 2.1 Autenticação e Sessão

- [ ] Senhas com hash seguro (bcryptjs custo >= 10 ou argon2)
- [ ] JWT com expiração definida (máximo 7 dias)
- [ ] Verificação de email obrigatória antes de ativar conta
- [ ] Reset de senha com token SHA-256, expiração curta (5-30 min), uso único
- [ ] Sessão invalidada após reset de senha (deletar todas as sessões do usuário)
- [ ] Google OAuth (ou outro provider) validado corretamente
- [ ] Callback URL sanitizada para evitar open redirect
- [ ] Usuários desativados (`isActive: false`) bloqueados no login

### 2.2 Autorização (RBAC)

- [ ] Matriz de permissões centralizada (não espalhada em if/else)
- [ ] Middleware protege todas as rotas do dashboard
- [ ] Rotas de API verificam permissão antes de executar lógica
- [ ] Nenhuma rota de admin acessível por role não-admin
- [ ] Operações sensíveis (delete, refund, export) exigem role específico

### 2.3 Rate Limiting

- [ ] Rate limit em todos os endpoints de autenticação (login, register, forgot, reset, resend)
- [ ] Rate limit em endpoints de mutação (checkout, webhooks, uploads)
- [ ] Rate limit em endpoints públicos de leitura intensiva (catálogo, busca)
- [ ] Rate limit distribuído (Redis/Upstash) em ambiente com múltiplas instâncias
- [ ] Headers de rate limit retornados (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`)
- [ ] Header `Retry-After` retornado em respostas 429

### 2.4 Validação de Entrada

- [ ] Todas as rotas POST/PATCH validam body com schema (Zod, Joi, etc.)
- [ ] Parâmetros de query validados em rotas GET
- [ ] Uploads validam MIME type, extensão e tamanho máximo
- [ ] IDs de rota (`[id]`) não acessam registros de outros usuários sem verificação de posse

### 2.5 Webhooks de Pagamento

- [ ] Assinatura HMAC verificada com `crypto.timingSafeEqual`
- [ ] Deduplicação de eventos por `providerId` (evitar processamento duplicado)
- [ ] Saída antecipada se evento já processado (idempotência)
- [ ] IP allowlist configurada e aplicada (se disponível pelo provider)
- [ ] Webhook retorna 200 mesmo em casos esperados de duplicata

### 2.6 Headers de Segurança

- [ ] `Content-Security-Policy` configurado
- [ ] `X-Frame-Options: DENY` ou `SAMEORIGIN`
- [ ] `X-Content-Type-Options: nosniff`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] `Permissions-Policy` limitando câmera, microfone, geolocalização
- [ ] HTTPS forçado em produção (`Strict-Transport-Security`)

### 2.7 Configuração

- [ ] Nenhum secret hardcoded no código
- [ ] `.env*` no `.gitignore`
- [ ] `.env.example` documenta todas as variáveis necessárias
- [ ] Server Actions com `allowedOrigins` usando variável de ambiente (não `localhost:3000`)
- [ ] Senha fraca não documentada no `.env.example` (seed, admin padrão)

### 2.8 Banco de Dados

- [ ] ORM previne SQL injection (Prisma, TypeORM, Drizzle)
- [ ] `DATABASE_URL` com connection pool separado de `DIRECT_URL` (Supabase/PgBouncer)
- [ ] Dados sensíveis não logados (CPF, email, telefone em textos de log)
- [ ] Soft delete implementado para entidades principais (produtos, usuários)

---

## 3. SEO

### 3.1 Metadata Básica

- [ ] `metadataBase` configurado no root layout
- [ ] `title` com template (`%s | Nome do Site`)
- [ ] `description` descritivo e único por página
- [ ] `keywords` relevantes por página
- [ ] `lang` correto no `<html>` (`pt-BR`, `en`, etc.)

### 3.2 Open Graph e Social

- [ ] `og:title`, `og:description`, `og:image` em todas as páginas públicas
- [ ] `og:image` com dimensões 1200x630
- [ ] `twitter:card: "summary_large_image"`
- [ ] `og:locale` correto

### 3.3 Canonical e Indexação

- [ ] `canonical` absoluto (não relativo) em todas as páginas públicas
- [ ] Páginas de dashboard/admin com `robots: { index: false }`
- [ ] `robots.ts` com `disallow` para `/api/` e `/dashboard/`
- [ ] `sitemap.ts` dinâmico incluindo todas as entidades públicas (produtos, categorias)
- [ ] `sitemap.ts` com `lastModified`, `changeFrequency` e `priority`
- [ ] `sitemap.ts` com fallback para rotas estáticas se DB falhar

### 3.4 Dados Estruturados (JSON-LD)

- [ ] Schema relevante na home (LocalBusiness, Organization, WebSite)
- [ ] Schema de produto nas páginas de produto (Product com preco, disponibilidade)
- [ ] Schema de FAQ na página de FAQ
- [ ] Schema de BreadcrumbList em páginas internas
- [ ] `serializeJsonLd` escapa `<` para evitar XSS no JSON-LD inline

### 3.5 Performance SEO

- [ ] ISR (`export const revalidate = N`) nas páginas com conteúdo que muda
- [ ] `generateStaticParams` para páginas de produto (SSG)
- [ ] Imagens com `alt` text descritivo em todas as ocorrências
- [ ] Fontes com `display: swap`

---

## 4. PERFORMANCE

### 4.1 Imagens

- [ ] `next/image` usado em todas as imagens (não `<img>`)
- [ ] Formatos AVIF e WebP configurados (`formats: ["image/avif", "image/webp"]`)
- [ ] `remotePatterns` configurado para domínios externos (CDN, R2, S3)
- [ ] Imagens acima do fold com `priority` ou `loading="eager"`
- [ ] Imagens abaixo do fold com `loading="lazy"` (padrão do next/image)

### 4.2 Cache e Revalidação

- [ ] Páginas públicas estáticas ou com ISR
- [ ] `unstable_cache` ou `cache: "force-cache"` nas funções de DB de leitura pública
- [ ] Headers `Cache-Control` em respostas de API que podem ser cacheadas
- [ ] CDN configurado para assets estáticos (Cloudflare, Vercel Edge)

### 4.3 JavaScript e Bundle

- [ ] `@next/bundle-analyzer` instalado e bundle analisado
- [ ] Componentes pesados com `dynamic(() => import(...), { ssr: false })`
- [ ] Bibliotecas de terceiros verificadas quanto a tamanho (evitar lodash completo, moment.js, etc.)
- [ ] Nenhum `"use client"` desnecessário em componentes puramente exibição

### 4.4 Operações Assíncronas

- [ ] Envio de email é fire-and-forget (não bloqueia resposta ao usuário)
- [ ] Upload de arquivos via presigned URL (não passa pelo servidor)
- [ ] Consultas ao banco com `select` explícito (sem `findMany` sem limites)
- [ ] Paginação em todas as listagens

### 4.5 Banco de Dados

- [ ] Connection pooling ativo (Supabase pooler, PgBouncer, etc.)
- [ ] Indexes no schema para campos usados em `where` e `orderBy`
- [ ] Sem N+1: `include` ou `select` aninhados ao invés de queries em loop
- [ ] Contagem separada da listagem em queries paginadas (evitar `SELECT COUNT(*)` junto)

---

## 5. USABILIDADE

### 5.1 Estados da UI

- [ ] `loading.tsx` em todos os contextos relevantes (public, dashboard, auth)
- [ ] `error.tsx` com botão de retry em todos os contextos relevantes
- [ ] `not-found.tsx` customizado com link de volta ao início
- [ ] Estado de erro em formulários (feedback visual inline, não só toast)
- [ ] Estado de loading em botões de submit (desabilitar durante request)
- [ ] Estado vazio em listagens (componente EmptyState)

### 5.2 Feedback ao Usuário

- [ ] Toast notifications para ações de sucesso e erro
- [ ] Mensagens de erro humanizadas (não stack traces)
- [ ] Confirmação antes de ações destrutivas (delete)
- [ ] Feedback imediato em ações assíncronas (spinner, progress)

### 5.3 Navegação e Acessibilidade

- [ ] Links de âncora para skip navigation (acessibilidade)
- [ ] Ordem de foco lógica em formulários
- [ ] Contraste adequado (WCAG AA: 4.5:1 para texto normal)
- [ ] Componentes interativos acessíveis via teclado
- [ ] `aria-label` em ícones sem texto visível

### 5.4 Fluxos Críticos

- [ ] Checkout para usuário autenticado funciona
- [ ] Checkout para convidado (guest checkout) funciona
- [ ] Consulta de pedido por convidado funciona
- [ ] Pix com polling de status funciona
- [ ] Reset de senha funciona do início ao fim
- [ ] Verificação de email funciona do início ao fim
- [ ] Redirecionamento após login usa callbackUrl corretamente

### 5.5 Mobile

- [ ] Layout responsivo em todas as páginas públicas
- [ ] Touch targets >= 44x44px em dispositivos móveis
- [ ] Formulários com tipo de input correto (`tel`, `email`, `number`)
- [ ] Sem scroll horizontal não intencional

---

## 6. BOAS PRÁTICAS

### 6.1 Arquitetura

- [ ] Separação clara entre camadas: UI → API → Service → Data
- [ ] Regras de negócio nos services, não nas rotas de API
- [ ] Componentes de página leves (delegam lógica para lib/)
- [ ] Sem lógica de DB em componentes React
- [ ] Domínios separados em módulos distintos (auth, billing, store, etc.)

### 6.2 Tratamento de Erros

- [ ] Hierarquia de erros customizados (`AppError`, `BadRequestError`, etc.)
- [ ] `handleRouteError` centralizado em todas as rotas
- [ ] Erros internos (500) não expõem detalhes técnicos ao cliente
- [ ] Erros com `expose: false` logados no servidor mas mascarados na resposta
- [ ] ZodError convertido para `ValidationAppError` com detalhes úteis

### 6.3 Resposta Padronizada

- [ ] Formato consistente: `{ ok: true, ...data }` / `{ ok: false, error, code, details }`
- [ ] Status HTTP correto em todas as respostas (201 para criação, 204 para delete, etc.)
- [ ] Headers de rate limit anexados em todas as respostas

### 6.4 Dependências

- [ ] Sem dependências beta/alpha em produção (verificar `^`, `~`, `beta`, `rc`)
- [ ] Versões fixadas para dependências críticas (evitar caret em ORM, auth)
- [ ] `npm audit` sem vulnerabilidades críticas ou altas
- [ ] `package.json` sem dependências não utilizadas (`depcheck`)

### 6.5 Configuração e Deploy

- [ ] `prisma/schema.prisma` com `url = env("DATABASE_URL")` e `directUrl = env("DIRECT_URL")`
- [ ] `next.config.ts` sem configurações hardcoded de ambiente
- [ ] `vercel.json` ou pipeline CI configurado
- [ ] Variáveis de ambiente documentadas e configuradas no painel de deploy
- [ ] Migrations aplicadas antes do deploy (`prisma migrate deploy`)

---

## 7. CLEAN CODE

### 7.1 Tamanho de Arquivos

- [ ] Nenhum arquivo de service com mais de 500 linhas
- [ ] Nenhum componente React com mais de 300 linhas
- [ ] Funções com responsabilidade única (Single Responsibility)
- [ ] Arquivos de 1000+ linhas divididos em módulos menores

### 7.2 Tipos TypeScript

- [ ] TypeScript strict mode ativado (`"strict": true` no tsconfig)
- [ ] Sem uso de `any` (usar `unknown` com type guards, ou tipos explícitos)
- [ ] Tipos de domínio exportados e reutilizados (não duplicados)
- [ ] Enums do Prisma importados e usados (não strings mágicas)

### 7.3 Nomenclatura e Organização

- [ ] Convenção consistente: camelCase funções, PascalCase tipos/componentes
- [ ] Sem variáveis com nomes genéricos (`data`, `result`, `temp`, `x`)
- [ ] Imports organizados (externos, internos, relativos)
- [ ] Sem código comentado esquecido

### 7.4 Duplicação

- [ ] Sem lógica duplicada entre rotas similares
- [ ] Schemas Zod reutilizados entre routes e services
- [ ] Componentes UI atômicos reutilizáveis (Button, Input, etc.)
- [ ] Funções utilitárias centralizadas (formatação de moeda, datas, etc.)

### 7.5 Comentários

- [ ] Sem `TODO`/`FIXME` não resolvidos no código
- [ ] Lógica complexa (webhook dedup, rate limit distribuído) documentada com comentário
- [ ] Sem comentários óbvios (`// incrementa o contador`)
- [ ] JSDoc em funções públicas de bibliotecas internas com parâmetros não evidentes

---

## 8. ITENS FREQUENTEMENTE ESQUECIDOS

### 8.1 Páginas Especiais

- [ ] `favicon.ico` ou `favicon.svg` configurado
- [ ] `apple-touch-icon` para iOS
- [ ] `manifest.json` para PWA (se aplicável)
- [ ] Página de manutenção (`503`)
- [ ] Página de política de privacidade
- [ ] Página de termos de uso
- [ ] Política de cookies / LGPD

### 8.2 Segurança Adicional

- [ ] Proteção contra clickjacking (`X-Frame-Options`)
- [ ] Tokens CSRF em formulários (se não usar SameSite cookies)
- [ ] Logs de auditoria em operações sensíveis (login, pagamento, delete)
- [ ] Rotação de segredos planejada (API keys, webhooks secrets)

### 8.3 Monitoramento

- [ ] Health check endpoint (`/api/health`) implementado
- [ ] Logs de erro estruturados (não apenas `console.error`)
- [ ] Serviço de monitoramento configurado (Sentry, Datadog, Axiom)
- [ ] Alertas para taxa de erro > threshold

### 8.4 Documentação

- [ ] `README.md` com instruções de setup local
- [ ] `.env.example` completo e comentado
- [ ] Documentação de API (OpenAPI/Swagger) para rotas consumidas por terceiros
- [ ] `CONTRIBUTING.md` se projeto colaborativo
- [ ] Diagrama de banco de dados (ER)

### 8.5 SEO Técnico Extra

- [ ] `hreflang` se site multilíngue
- [ ] `og:url` com URL canônica absoluta
- [ ] Evitar conteúdo duplicado entre `/loja` e `/products` (usar redirect permanente)
- [ ] Breadcrumbs implementados em páginas de produto/categoria
- [ ] Schema `BreadcrumbList` nas páginas internas

---

## PLANILHA DE RESULTADO

Preencha após concluir o checklist:

| Categoria | Total | OK | Pendente | Problema | % OK |
|-----------|-------|----|----------|----------|------|
| Testes | 14 | | | | |
| Segurança | 28 | | | | |
| SEO | 18 | | | | |
| Performance | 20 | | | | |
| Usabilidade | 20 | | | | |
| Boas Práticas | 20 | | | | |
| Clean Code | 20 | | | | |
| Itens Esquecidos | 20 | | | | |
| **TOTAL** | **160** | | | | |

---

## PLANO DE AÇÃO — TEMPLATE

Copie e preencha com os problemas encontrados:

### CRÍTICO (bloqueia produção)
1. [ ] `[SEC-XX]` — Descrição — Arquivo: `path/to/file.ts`
2. [ ] ...

### ALTO (corrigir antes do próximo release)
1. [ ] `[PERF-XX]` — Descrição — Arquivo: `path/to/file.ts`
2. [ ] ...

### MÉDIO (próxima sprint)
1. [ ] `[UX-XX]` — Descrição
2. [ ] ...

### BAIXO (backlog)
1. [ ] `[CC-XX]` — Descrição
2. [ ] ...

---

*Gerado em: 2026-04-13 | Base: auditoria do projeto gym-system-mercadopago-express-vercel-JS*
