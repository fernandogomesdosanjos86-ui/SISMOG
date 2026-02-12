-- Create postos_trabalho table
create table public.postos_trabalho (
  id uuid primary key default gen_random_uuid(),
  empresa text not null check (empresa in ('FEMOG', 'SEMOG')),
  nome text not null,
  status text default 'ativo' check (status in ('ativo', 'inativo')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for postos_trabalho
alter table public.postos_trabalho enable row level security;

create policy "Enable read access for authenticated users"
on public.postos_trabalho for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on public.postos_trabalho for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on public.postos_trabalho for update
to authenticated
using (true);

create policy "Enable delete for authenticated users"
on public.postos_trabalho for delete
to authenticated
using (true);


-- Create alocacoes_funcionarios table
create table public.alocacoes_funcionarios (
  id uuid primary key default gen_random_uuid(),
  posto_id uuid not null references public.postos_trabalho(id) on delete cascade,
  funcionario_id uuid not null references public.funcionarios(id) on delete cascade,
  escala text check (escala in ('12x36', '5x2', '5x1', 'Outro')),
  turno text check (turno in ('Diurno', 'Noturno')),
  he boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS for alocacoes_funcionarios
alter table public.alocacoes_funcionarios enable row level security;

create policy "Enable read access for authenticated users"
on public.alocacoes_funcionarios for select
to authenticated
using (true);

create policy "Enable insert for authenticated users"
on public.alocacoes_funcionarios for insert
to authenticated
with check (true);

create policy "Enable update for authenticated users"
on public.alocacoes_funcionarios for update
to authenticated
using (true);

create policy "Enable delete for authenticated users"
on public.alocacoes_funcionarios for delete
to authenticated
using (true);

-- Unique index to ensure one main allocation (he=false) per employee
create unique index unique_main_allocation_per_employee
on public.alocacoes_funcionarios (funcionario_id)
where (he = false);
