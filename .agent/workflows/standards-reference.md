---
description: Referência detalhada com exemplos de código para os Padrões Globais SISMOG
---

# Referência Detalhada - Padrões SISMOG

> Este documento complementa `standards.md` com exemplos de código concretos, anti-padrões documentados e checklists detalhados.

---

## PARTE 1: ARQUITETURA — Exemplos de Código

### 1.1 Client Supabase Tipado

```typescript
// ✅ CORRETO — src/services/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// ❌ ERRADO — sem tipagem
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

**Regenerar types quando o schema mudar:**
Usar MCP `supabase-mcp-server generate_typescript_types` e atualizar `src/types/database.ts`.

### 1.2 Service com Colunas Explícitas

```typescript
// ✅ CORRETO
async getContratos() {
    const { data, error } = await supabase
        .from('contratos')
        .select('id, empresa, contratante, nome_posto, valor_mensal, status')
        .order('created_at', { ascending: false });
    if (error) throw error;
    return data as unknown as Contrato[];
}

// ❌ ERRADO — select('*') transfere dados desnecessários
async getContratos() {
    const { data, error } = await supabase.from('contratos').select('*');
}
```

### 1.3 Cast Seguro para Insert/Update

```typescript
// ✅ CORRETO — cast com `as any` quando tipos frontend divergem do DB
const { data, error } = await supabase
    .from('equipamentos')
    .insert(equipamento as any)  // frontend Partial<Equipamento> vs DB required fields
    .select()
    .single();

// ✅ CORRETO — cast para leitura
return data as unknown as Equipamento[];

// ❌ ERRADO — nunca silenciar tipo sem documentar
.insert(equipamento)  // TS error: Partial<X> não é atribuível a Insert<X>
```

### 1.4 Query Keys Factory

```typescript
// ✅ CORRETO — em queryClient.ts
novaEntidade: {
    all: ['novaEntidade'] as const,
    list: () => [...queryKeys.novaEntidade.all, 'list'] as const,
    detail: (id: string) => [...queryKeys.novaEntidade.all, 'detail', id] as const,
},

// ❌ ERRADO — query keys inline
useQuery({ queryKey: ['contratos', 'list'], ... })  // não tipado, propenso a typos
```

### 1.5 staleTime por Tipo de Dado

```typescript
// ✅ CORRETO — usar STALE_TIMES do queryClient
import { STALE_TIMES, queryKeys } from '../../../lib/queryClient';

useQuery({
    queryKey: queryKeys.cargos.list(),
    queryFn: () => rhService.getCargosSalarios(),
    staleTime: STALE_TIMES.STATIC,  // 30min — dados raramente mudam
});

// ❌ ERRADO — staleTime hardcoded
useQuery({ ..., staleTime: 1000 * 60 * 5 })  // magic number, sem semântica
```

---

## PARTE 2: SEGURANÇA — Padrões RLS

### 2.1 Template RLS por Perfil

```sql
-- Adm: acesso total
CREATE POLICY "adm_full_access" ON public.tabela
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.funcionarios f
            WHERE LOWER(f.email) = LOWER(auth.jwt() ->> 'email')
            AND LOWER(f.permissao) = 'adm'
        )
    );

-- Gestão: acesso com restrição por setor (exemplo financeiro)
CREATE POLICY "gestao_financeiro" ON public.contratos
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.funcionarios f
            WHERE LOWER(f.email) = LOWER(auth.jwt() ->> 'email')
            AND LOWER(f.permissao) = 'gestor'
            AND LOWER(f.setor) IN ('financeiro', 'direção')
        )
    );

-- Operador: apenas SELECT
CREATE POLICY "operador_read" ON public.frota_veiculos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.funcionarios f
            WHERE LOWER(f.email) = LOWER(auth.jwt() ->> 'email')
            AND LOWER(f.permissao) = 'operador'
        )
    );
```

### 2.2 Checklist de Segurança por Tabela
- [ ] RLS habilitada (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] Policy para cada perfil (Adm, Gestão, Operador)
- [ ] Policies usam `LOWER()` para comparação case-insensitive
- [ ] Testado com token de Operador
- [ ] `service_role_key` NUNCA no frontend

---

## PARTE 3: PERFORMANCE — Configurações

### 3.1 Vite Config Completo

```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-supabase': ['@supabase/supabase-js'],
          'vendor-charts': ['recharts'],
          'vendor-pdf': ['jspdf', 'jspdf-autotable'],
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 600,
  },
  esbuild: {
    drop: ['debugger'],  // Remove debugger em prod
  }
});
```

### 3.2 Vercel Config

```json
{
    "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
    "headers": [{
        "source": "/assets/(.*)",
        "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }]
}
```

### 3.3 Lazy Loading de Rotas

```typescript
// ✅ CORRETO — em App.tsx
const Contratos = lazy(() => import('./features/financeiro/Contratos'));
<Route path={ROUTES.CONTRATOS} element={<Contratos />} />

// ❌ ERRADO
import Contratos from './features/financeiro/Contratos';  // Carrega tudo no bundle inicial
```

### 3.4 DevTools Condicional

```typescript
// ✅ CORRETO — em main.tsx
const LazyDevtools = import.meta.env.DEV
  ? React.lazy(() => import('@tanstack/react-query-devtools').then(m => ({ default: m.ReactQueryDevtools })))
  : null;

// Uso:
{LazyDevtools && (
  <React.Suspense fallback={null}>
    <LazyDevtools initialIsOpen={false} />
  </React.Suspense>
)}
```

---

## PARTE 4: RESILIÊNCIA — Padrões de Erro

### 4.1 ErrorBoundary com Sentry

```typescript
// componentDidCatch em ErrorBoundary.tsx
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    Sentry.captureException(error, {
        extra: { componentStack: errorInfo.componentStack }
    });
}
```

### 4.2 Sentry Init (apenas produção)

```typescript
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration({ maskAllText: false, blockAllMedia: false }),
        ],
        tracesSampleRate: 0.2,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
        environment: 'production',
    });
}
```

### 4.3 Tratamento de Nulls do Supabase

```typescript
// ✅ CORRETO — tratar boolean|null do DB como boolean no frontend
calculateRetencoes(base: {
    retencao_pis: boolean | null;  // DB retorna null
    perc_iss: number | null;
}, valorBruto: number) {
    const pis = base.retencao_pis ? valorBruto * 0.0065 : 0;  // null → false (correto)
    const iss = base.retencao_iss ? valorBruto * ((base.perc_iss || 0) / 100) : 0;
}

// ❌ ERRADO — assumir que DB sempre retorna boolean
calculateRetencoes(base: { retencao_pis: boolean }) { ... }  // Crash se null
```

---

## PARTE 5: MANUTENIBILIDADE — Refactoring Patterns

### 5.1 Sidebar Modular (Padrão Aplicado)
```
components/
├── Sidebar.tsx              (120 linhas — orquestrador)
├── sidebar/
│   ├── sidebarNavItems.ts   (dados de navegação)
│   ├── SidebarNavItem.tsx   (componente de item)
│   └── SidebarUserFooter.tsx (perfil + ações)
```

**Regra:** Se um componente excede 200 linhas, aplicar esse padrão de extração:
1. Extrair dados estáticos → arquivo `.ts` separado
2. Extrair sub-componentes → pasta `componentName/`
3. Manter orquestrador fino → apenas composição

### 5.2 Anti-Padrões Documentados

| Anti-Padrão | Onde Aparecia | Correção |
|------------|--------------|----------|
| `select('*')` | 10 services | Listar colunas explícitas |
| `con_usuarios` (tabela errada) | checklists, movimentacoes | Renomear para `usuarios` |
| `locationPath` não usado | SidebarNavItem | Remover prop e uso |
| `boolean` vs `boolean \| null` | financeiroService | Atualizar assinatura para aceitar `null` |
| DevTools sempre carregado | main.tsx | Lazy load condicional |
| Sidebar monolítica (304 linhas) | Sidebar.tsx | Extração modular |

---

## PARTE 6: UX/COMPLIANCE — Decisões de Design

### 6.1 Ordem de Dados
- Tabelas de funcionários: **ordem alfabética pelo nome**
- Tabelas de registros: `created_at DESC` (mais recente primeiro)
- Faturamentos: por competência DESC

### 6.2 Formatação
```typescript
// ✅ USAR utils/format.ts
import { formatCurrency, formatDate, formatCPF } from '../../utils/format';

formatCurrency(1500.50)  // → "R$ 1.500,50"
formatDate('2024-01-15') // → "15/01/2024"
```

### 6.3 Feedback ao Usuário
```typescript
// ✅ OBRIGATÓRIO após mutations
showFeedback('success', 'Registro salvo com sucesso!');
showFeedback('error', 'Erro ao salvar. Tente novamente.');

// ❌ ERRADO — feedback via alert ou console
alert('Salvo!');
console.log('Erro:', err);
```

### 6.4 Skeleton Loading
```tsx
// ✅ CORRETO — skeleton visible durante carregamento
<ResponsiveTable
    data={filteredData}
    loading={isLoading}
    skeletonRows={5}
    ...
/>

// ❌ ERRADO — tela em branco durante fetch
{data && <table>...</table>}
```

---

## APÊNDICE: Mapa de Arquivos Modificados (Otimizações)

| Arquivo | Mudança |
|---------|---------|
| `src/services/supabase.ts` | `createClient<Database>()` |
| `src/lib/queryClient.ts` | `STALE_TIMES` + query keys factory |
| `src/main.tsx` | Sentry + lazy DevTools |
| `src/components/ErrorBoundary.tsx` | `captureException` |
| `src/components/Sidebar.tsx` | Refatoração modular (304→120) |
| `src/components/sidebar/*` | 3 novos módulos extraídos |
| `src/services/rhService.ts` | `.select(colunas)` |
| `src/services/equipamentosService.ts` | `.select(colunas)` + casts |
| `src/services/estoqueGestaoService.ts` | `.select(colunas)` + cast |
| `src/services/financeiroService.ts` | `.select(colunas)` + `calculateRetencoes` nullable |
| `src/services/supervisaoService.ts` | `.select(colunas)` |
| `src/services/servicosExtrasService.ts` | `.select(colunas)` |
| `src/services/escalasService.ts` | upsert cast |
| `src/features/frota/services/*.ts` | casts + tabela `usuarios` |
| `src/features/geral/tarefas/services/tarefasService.ts` | enum cast |
| `src/features/geral/curriculos/services/curriculoService.ts` | `.select(colunas)` |
| `src/features/users/useUsers.ts` | `.select(colunas)` |
| `vite.config.ts` | `manualChunks` + `esbuild.drop` |
| `vercel.json` | Cache headers + SPA rewrite |
| `index.html` | `lang="pt-BR"` |
