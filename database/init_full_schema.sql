-- Tabelas Base (Dependências)

-- Tabela: funcionarios (Se ainda não existir)
create table if not exists public.funcionarios (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id) on delete cascade,
  nome_completo text not null,
  cpf text,
  funcao text, -- Cargo simples ou referência futura
  status text default 'ativo',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- Tabela: postos_trabalho
create table if not exists public.postos_trabalho (
  id uuid default gen_random_uuid() primary key,
  empresa_id uuid references public.empresas(id) on delete cascade,
  nome text not null,
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- Tabela: postos_funcionarios
create table if not exists public.postos_funcionarios (
  id uuid default gen_random_uuid() primary key,
  posto_id uuid references public.postos_trabalho(id) on delete cascade,
  funcionario_id uuid references public.funcionarios(id) on delete cascade,
  empresa_id uuid references public.empresas(id) on delete cascade,
  escala text,
  turno text,
  servico_extra boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  deleted_at timestamp with time zone
);

-- RLS Policies
alter table public.funcionarios enable row level security;
alter table public.postos_trabalho enable row level security;
alter table public.postos_funcionarios enable row level security;

create policy "Enable all for authenticated users" on public.funcionarios for all using (true);
create policy "Enable all for authenticated users" on public.postos_trabalho for all using (true);
create policy "Enable all for authenticated users" on public.postos_funcionarios for all using (true);
