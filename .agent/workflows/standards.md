---
description: Padrões Globais SISMOG - Arquitetura, Segurança, Performance, Resiliência, Manutenibilidade e UX
---

# /standards - Padrões Globais SISMOG

> Documento master de regras e padrões. Para referência detalhada com exemplos de código, consulte `standards-reference.md`.

---

## 1. 🏗️ ARQUITETURA E ENGENHARIA

### 1.1 Stack e Infraestrutura
| Camada | Tecnologia | Regra |
|--------|-----------|-------|
| **Frontend** | React + TypeScript + Vite | Strict mode obrigatório. Zero `any` exceto casts documentados de Supabase |
| **Backend** | Supabase (BaaS) | Projeto `SISMOG`. Toda lógica de dados via PostgREST/RPC |
| **Deploy** | Vercel | CI/CD automático. Build DEVE passar `tsc -b && vite build` |
| **Monitoramento** | Sentry | Apenas produção. DSN via `VITE_SENTRY_DSN` |
| **Cache** | React Query | staleTime dinâmico por tipo de dado |

### 1.2 Estrutura de Diretórios (Obrigatória)
```
src/
├── components/       # Componentes globais reutilizáveis
│   ├── forms/        # InputField, SelectField, MaskedInputField
│   ├── modals/       # GlobalModals
│   └── sidebar/      # Sidebar modular (SidebarNavItem, SidebarUserFooter)
├── config/           # routes.ts
├── context/          # AuthContext, ModalContext
├── features/         # Módulos por domínio (feature-based)
│   └── [module]/
│       ├── types.ts
│       ├── hooks/use[Entity]s.ts
│       ├── services/[entity]Service.ts  # Se específico do módulo
│       ├── components/
│       │   ├── [Entity]Form.tsx
│       │   └── [Entity]Details.tsx
│       └── [Entity]s.tsx               # Página principal
├── lib/              # queryClient.ts (config global)
├── services/         # Services compartilhados (supabase, financeiroService, etc.)
├── types/            # database.ts (gerado pelo Supabase)
└── utils/            # format.ts, helpers
```

### 1.3 Regras de Nomenclatura
| Item | Padrão | Exemplo |
|------|--------|---------|
| Tabelas Supabase | `snake_case` | `frota_abastecimentos` |
| Tipos TypeScript | `PascalCase` | `Abastecimento`, `MovimentacaoFormData` |
| Services | `camelCase + Service` | `abastecimentosService` |
| Hooks | `use + PascalCase` | `useAbastecimentos` |
| Query Keys | Factory em `queryClient.ts` | `queryKeys.frota.abastecimentos.all` |
| Componentes | `PascalCase.tsx` | `ChecklistForm.tsx` |
| Rotas | `SCREAMING_SNAKE` em `routes.ts` | `ROUTES.ABASTECIMENTOS` |

### 1.4 Regras de Código
- **NUNCA** usar `select('*')`. Sempre listar colunas explicitamente
- **NUNCA** usar tabela `con_usuarios`. O nome correto é `usuarios`
- **SEMPRE** usar `createClient<Database>()` (client tipado)
- **SEMPRE** usar `as any` com comentário ao inserir/atualizar onde tipos frontend divergem do schema
- **SEMPRE** registrar query keys em `queryClient.ts` ANTES de criar hooks
- **NUNCA** fazer `console.log` em produção — usar Sentry para erros

---

## 2. 🔒 SEGURANÇA E PROTEÇÃO DE DADOS

### 2.1 Autenticação e Autorização
- Login via Supabase Auth (`supabase.auth.signInWithPassword`)
- Sessão gerenciada pelo `AuthContext`
- Rotas protegidas via `ProtectedRoute` em `App.tsx`
- `anon key` é pública — **toda segurança real está nas RLS policies**

### 2.2 RLS (Row Level Security) — OBRIGATÓRIO
| Perfil | Nível de Acesso |
|--------|----------------|
| **Adm** | CRUD completo (exceto tarefas: mantém lógica por remetente/destinatário) |
| **Gestão** | CRUD completo, com restrições financeiras por setor |
| **Operador** | CR em frota, SELECT em `funcionarios`/`postos_trabalho`/`frota_veiculos`, bloqueio total no restante |

**Regras RLS:**
- Toda tabela nova DEVE ter RLS habilitada antes do deploy
- Policies devem usar `auth.uid()` para identificar o usuário
- Comparação de `permissao` e `setor` deve ser case-insensitive com `LOWER()`
- Testar policies com perfil `Operador` antes de considerar pronto

### 2.3 Variáveis de Ambiente
| Variável | Obrigatória | Exposição |
|----------|------------|-----------|
| `VITE_SUPABASE_URL` | ✅ | Frontend (pública) |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Frontend (pública, protegida por RLS) |
| `VITE_SENTRY_DSN` | Apenas prod | Frontend (pública) |

**NUNCA** colocar `service_role_key` ou segredos no frontend.

### 2.4 Validação de Dados
- Validação no frontend É obrigatória (UX), mas NÃO substitui RLS
- `required` nos campos de formulário HTML
- Validações de formato (CPF, datas) via `MaskedInputField`
- Services devem tratar `null`/`undefined` explicitamente (não confiar em `??`)

---

## 3. ⚡ PERFORMANCE E ESCALABILIDADE

### 3.1 Cache (React Query)
```
STATIC   → 30min  (cargos, postos, veículos, equipamentos, currículos)
MODERATE → 5min   (funcionários, contratos, escalas) ← DEFAULT
DYNAMIC  → 2min   (apontamentos, faturamentos, recebimentos, tarefas)
REALTIME → 30s    (chats)
```
- `gcTime`: 30 minutos
- `retry`: 2 para queries, 1 para mutations
- `refetchOnWindowFocus`: **false** (evita fetches desnecessários)

### 3.2 Bundle (Vite)
- `manualChunks` configurado em `vite.config.ts`:
  - `vendor-react`, `vendor-query`, `vendor-supabase`, `vendor-charts`, `vendor-pdf`, `vendor-icons`
- `chunkSizeWarningLimit`: 600KB
- `esbuild.drop`: `['debugger']` (remove debugger statements)
- Todas as rotas de página usam `React.lazy()` em `App.tsx`

### 3.3 Vercel
- `/assets/*` com `Cache-Control: public, max-age=31536000, immutable`
- SPA rewrite: `/(.*) → /index.html`
- Build command: `tsc -b && vite build`

### 3.4 Select Otimizado
- Listar apenas colunas necessárias: `.select('id, nome, empresa, status')`
- Para joins, especificar colunas do join: `.select('*, frota_veiculos!inner(marca_modelo, placa)')`
- Paginação server-side via `.range(from, to)` para tabelas >500 registros (ex: frota)

### 3.5 Regras Anti-Performance
❌ `select('*')` sem tipagem  
❌ `refetchOnWindowFocus: true`  
❌ Importar bibliotecas inteiras (ex: `import _ from 'lodash'`)  
❌ DevTools em produção  
❌ `console.log` em loops de renderização  

---

## 4. 🛡️ RESILIÊNCIA E OBSERVABILIDADE

### 4.1 Error Boundary
- `ErrorBoundary` global envolve `<App />` em `main.tsx`
- `componentDidCatch` envia para Sentry via `captureException`
- Fallback UI com botão "Recarregar"

### 4.2 Sentry (Produção)
```
tracesSampleRate: 0.2        (20% das transações)
replaysSessionSampleRate: 0.1 (10% das sessões)
replaysOnErrorSampleRate: 1.0 (100% em erros)
```
- Integrations: `browserTracingIntegration`, `replayIntegration`
- Inicialização condicional: `import.meta.env.PROD && VITE_SENTRY_DSN`

### 4.3 Tratamento de Erros em Services
```typescript
// PADRÃO OBRIGATÓRIO em services:
async getEntidades() {
    const { data, error } = await supabase.from('tabela').select('col1, col2');
    if (error) throw error;        // Propaga para React Query
    return data as Entidade[];      // Cast com tipagem frontend
}
```
- React Query captura e expõe via `isError` nos hooks
- Toast de feedback via `showFeedback('error', mensagem)` do `ModalContext`
- **NUNCA** silenciar erros com `try/catch` vazio

### 4.4 Retry e Fallback
- Queries: retry 2x com backoff exponencial (React Query padrão)
- Mutations: retry 1x
- `refetchOnReconnect: true` — recarrega dados ao voltar online
- Skeleton loaders durante carregamento (nunca tela em branco)

---

## 5. 📖 MANUTENIBILIDADE E DOCUMENTAÇÃO

### 5.1 Componentização
- Componente > 200 linhas → **DEVE** ser refatorado (ex: Sidebar 304→120 linhas)
- Extrair dados estáticos para arquivos separados (ex: `sidebarNavItems.ts`)
- Um componente = uma responsabilidade

### 5.2 Padrão de Service
Todo service DEVE seguir este contrato:
```typescript
export const entityService = {
    getEntities():   Promise<Entity[]>,         // Lista com colunas específicas
    getEntityById(): Promise<Entity>,            // Detalhe único
    createEntity():  Promise<Entity>,            // Insert + select + single
    updateEntity():  Promise<Entity>,            // Update + select + single
    deleteEntity():  Promise<void>,              // Delete por id
};
```

### 5.3 Padrão de Hook
Todo hook DEVE expor:
```typescript
return {
    entities: data ?? [],          // Array (nunca undefined)
    isLoading,                     // boolean
    refetch,                       // () => void
    create: mutateAsync,           // Mutation com onSuccess invalidando cache
    update: mutateAsync,
    delete: mutateAsync,
    isCreating, isUpdating, isDeleting,  // boolean para feedback visual
};
```

### 5.4 Checklist para Nova Feature
- [ ] `types.ts` com interfaces
- [ ] Query keys em `queryClient.ts`
- [ ] Service com colunas explícitas
- [ ] Hook com mutations
- [ ] `Details.tsx` (padrão premium card)
- [ ] `Form.tsx` (componentes globais de input)
- [ ] Page principal com FilterBar → Tabs → Table
- [ ] Rota em `routes.ts` + `App.tsx` (lazy) + `Sidebar`
- [ ] RLS policies na tabela Supabase
- [ ] Build local `npm run build` passando (0 erros)

### 5.5 Comentários
- Comentários em inglês (código é em inglês)
- Comentar apenas o **porquê**, nunca o **o quê**
- `// TODO:` para débitos técnicos documentados
- `as any` deve ter comentário indicando motivo do cast

---

## 6. ✨ CONFORMIDADE E UX

### 6.1 Consultar ui-ux-pro-max.md
Para padrões visuais detalhados (componentes, badges, modais, forms), consultar:
`/.agent/workflows/ui-ux-pro-max.md`

### 6.2 Hierarquia Visual (Ordem na Página)
```
1. PageHeader (título + botão ação)
2. KPI Cards (grid 3 colunas, opcional)
3. Filter Bar (search + filtros dropdown)    ← ANTES das tabs
4. Company/View Tabs                          ← DEPOIS dos filtros
5. ResponsiveTable (com skeleton + cards mobile)
6. Loading Overlay (condicional)
```

### 6.3 Componentes Obrigatórios
| Necessidade | Componente | ❌ Proibido |
|------------|-----------|------------|
| Badge empresa | `<CompanyBadge>` | `<span>` manual com cores |
| Status ativo/inativo | `<StatusBadge>` | `<span>` manual |
| Tabela | `<ResponsiveTable>` | `<table>` manual |
| Input texto | `<InputField>` | `<input>` nativo |
| Select | `<SelectField>` | `<select>` nativo |
| CPF/CNPJ | `<MaskedInputField>` | `<input>` com regex |
| Botão primário | `<PrimaryButton>` | `<button>` com classes |
| Header página | `<PageHeader>` | `<h1>` manual |

### 6.4 Mobile
- Todas as tabelas DEVEM ter `renderCard` para visualização mobile
- Cards mobile com `border-l-4` colorido por empresa
- Filter bar: `flex-col` em mobile, `flex-row` em desktop

### 6.5 Modais
- Título: "Detalhes do/da [Entidade]" (nunca genérico)
- Formulário: mínimo `space-y-6`, grid `md:grid-cols-2`
- Footer: "Cancelar" (botão ghost) + "Salvar" (`PrimaryButton`)
- Feedback: `showFeedback('success'|'error', mensagem)`

### 6.6 Acessibilidade
- `lang="pt-BR"` em `index.html`
- `focus:ring-2 focus:ring-blue-500` em todos os inputs
- Labels em todos os campos de formulário
- Loading states com `aria-busy="true"` (quando aplicável)

---

## ⚠️ REGRAS DE DEPLOY (Vercel)

### Pre-Deploy Checklist
1. `npm run build` local → **0 erros** (bloqueio absoluto)
2. Nenhum `import.meta.env.VITE_*` sem fallback
3. Todas as rotas lazy-loaded em `App.tsx`
4. Nenhum `console.log` em código de produção
5. `vercel.json` com rewrites + cache headers
6. RLS policies aplicadas nas novas tabelas

### Erros Comuns que Bloqueiam Deploy
| Erro | Causa | Solução |
|------|-------|---------|
| `TS6133` | Variável declarada sem uso | Remover a declaração |
| `TS2769` | Overload mismatch no insert/update | `as any` com comentário |
| `TS2322` | Tipo incompatível (null vs undefined) | Ajustar tipo ou cast |
| `TS2339` | Propriedade não existe | Verificar nome da coluna no Supabase |
