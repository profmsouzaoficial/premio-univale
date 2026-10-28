-- =====================================================================
-- 0002_seguranca_rls.sql
-- Prêmio UNIVALE PPG/GIT 2025 — fechamento do RLS e remoção de credenciais
--
-- Contexto: o schema original (supabase_schema.sql) liga RLS mas cria as
-- policies com USING (true) / WITH CHECK (true) para tudo. Na prática isso
-- equivale a RLS desligado: a anon key (pública, vai no bundle) lê e grava
-- qualquer coisa. Este script substitui essas policies por regras reais.
--
-- Rode no SQL Editor do Supabase, na ordem. Faça backup antes.
--
-- ORDEM IMPORTA: o app novo lista os membros por membros_publicos (que inclui
-- o e-mail). Aplique esta migration ANTES de publicar um build, senão a tela
-- de login fica sem a lista de membros. O app atual tem fallback para
-- membros_comissao, então consegue operar nas duas situações.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. DIAGNÓSTICO (só leitura — rode primeiro e guarde a saída)
-- ---------------------------------------------------------------------
select tablename, rowsecurity as rls_ligado
from pg_tables where schemaname = 'public' order by tablename;

select policyname, tablename, cmd, roles, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;

-- ---------------------------------------------------------------------
-- 1. VÍNCULO ENTRE MEMBRO E USUÁRIO DO SUPABASE AUTH
--    O app usa ids-slug ('andrey-souza'); o Auth usa UUID.
--    Sem esta coluna não há como escrever policy por auth.uid().
-- ---------------------------------------------------------------------
alter table public.membros_comissao
  add column if not exists auth_user_id uuid unique
  references auth.users(id) on delete set null;

update public.membros_comissao m
   set auth_user_id = u.id
  from auth.users u
 where lower(u.email) = lower(m.email)
   and m.auth_user_id is null;

-- Precisa retornar ZERO linhas antes de continuar:
select id, nome, email from public.membros_comissao where auth_user_id is null;

-- ---------------------------------------------------------------------
-- 2. DERRUBAR AS POLICIES PERMISSIVAS DO SCHEMA ORIGINAL
-- ---------------------------------------------------------------------
drop policy if exists "Permitir leitura de avaliadores para autenticação" on public.avaliadores;
drop policy if exists "Permitir leitura de dissertações"                  on public.dissertacoes;
drop policy if exists "Permitir leitura e gravação de avaliações"         on public.avaliacoes;
drop policy if exists "Permitir leitura e gravação de atas homologadas"   on public.atas_homologadas;
drop policy if exists "Permitir leitura pública de dissertações"          on storage.objects;
drop policy if exists "Permitir upload para membros da comissão"          on storage.objects;

-- ---------------------------------------------------------------------
-- 3. HELPER: papel do usuário autenticado
-- ---------------------------------------------------------------------
create or replace function public.sou_presidente()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.membros_comissao
     where auth_user_id = auth.uid() and papel = 'presidente'
  );
$$;

create or replace function public.meu_membro_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select id from public.membros_comissao where auth_user_id = auth.uid();
$$;

revoke all on function public.sou_presidente() from public, anon;
revoke all on function public.meu_membro_id() from public, anon;
grant execute on function public.sou_presidente() to authenticated;
grant execute on function public.meu_membro_id() to authenticated;

-- ---------------------------------------------------------------------
-- 4. membros_comissao — ninguém lê a tabela direto
--    O seletor de login usa uma view pública SEM a senha.
-- ---------------------------------------------------------------------
alter table public.membros_comissao enable row level security;

drop policy if exists membros_select_proprio on public.membros_comissao;
create policy membros_select_proprio on public.membros_comissao
  for select to authenticated
  using (auth_user_id = auth.uid());

-- o presidente administra a comissão (tela de membros)
drop policy if exists membros_admin_presidente on public.membros_comissao;
create policy membros_admin_presidente on public.membros_comissao
  for all to authenticated
  using (public.sou_presidente())
  with check (public.sou_presidente());

-- A tela de login precisa listar os membros ANTES de existir sessão.
-- O e-mail é o usuário do Supabase Auth; sem ele o app não consegue entrar.
--
-- Usamos DROP + CREATE (e não CREATE OR REPLACE) de propósito: o
-- CREATE OR REPLACE VIEW só aceita colunas NOVAS no fim da lista. Se a view
-- já existir com (id, nome, ..., papel, ordem), tentar inserir "email" antes
-- de "ordem" falha com 42P16: cannot change name of view column "ordem".
drop view if exists public.membros_publicos;

create view public.membros_publicos as
  select id, nome, titulacao, instituicao, papel, email, ordem
  from public.membros_comissao
  order by ordem;

grant select on public.membros_publicos to anon, authenticated;

-- ---------------------------------------------------------------------
-- 5. avaliacoes — cada um enxerga e grava somente a própria ficha
--    (sigilo entre pares). O presidente consolida pela RPC da seção 7.
-- ---------------------------------------------------------------------
alter table public.avaliacoes enable row level security;

drop policy if exists av_select_propria on public.avaliacoes;
create policy av_select_propria on public.avaliacoes
  for select to authenticated
  using (avaliador_id = public.meu_membro_id());

drop policy if exists av_insert_propria on public.avaliacoes;
create policy av_insert_propria on public.avaliacoes
  for insert to authenticated
  with check (avaliador_id = public.meu_membro_id());

drop policy if exists av_update_propria on public.avaliacoes;
create policy av_update_propria on public.avaliacoes
  for update to authenticated
  using (avaliador_id = public.meu_membro_id())
  with check (avaliador_id = public.meu_membro_id());

-- Sem policy de DELETE: ninguém apaga avaliação pela API.

-- ---------------------------------------------------------------------
-- 6. dissertacoes / atas_homologadas / avaliadores
-- ---------------------------------------------------------------------
alter table public.dissertacoes enable row level security;
drop policy if exists diss_select on public.dissertacoes;
create policy diss_select on public.dissertacoes
  for select to authenticated using (true);
drop policy if exists diss_write_presidente on public.dissertacoes;
create policy diss_write_presidente on public.dissertacoes
  for all to authenticated
  using (public.sou_presidente()) with check (public.sou_presidente());

alter table public.atas_homologadas enable row level security;
drop policy if exists atas_presidente on public.atas_homologadas;
create policy atas_presidente on public.atas_homologadas
  for all to authenticated
  using (public.sou_presidente()) with check (public.sou_presidente());

-- tabela legada de credenciais: sem acesso nenhum pela API
alter table public.avaliadores enable row level security;
revoke all on public.avaliadores from anon, authenticated;

-- ---------------------------------------------------------------------
-- 7. CONSOLIDAÇÃO PARA O PRESIDENTE (substitui leitura direta da tabela)
-- ---------------------------------------------------------------------
create or replace function public.consolidacao_presidente()
returns table (
  dissertacao_id text,
  autor          text,
  media_likert   numeric,
  media_livre    numeric,
  media_final    numeric,
  n_avaliacoes   bigint,
  total_esperado bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select d.id,
         d.autor,
         round(avg(a.somatorio_likert_75), 2),
         round(avg(a.nota_livre_25), 2),
         round(avg(a.nota_final_100), 2),
         count(a.id) filter (where a.concluida),
         (select count(*) from public.membros_comissao)
  from public.dissertacoes d
  left join public.avaliacoes a on a.dissertacao_id = d.id
  where public.sou_presidente()
  group by d.id, d.autor;
$$;

revoke all on function public.consolidacao_presidente() from public, anon;
grant execute on function public.consolidacao_presidente() to authenticated;

-- ---------------------------------------------------------------------
-- 8. STORAGE — leitura pública dos PDFs, upload só da presidência
--    (a policy original permitia upload por qualquer um, inclusive anon,
--     o que permite trocar o PDF de uma dissertação)
-- ---------------------------------------------------------------------
drop policy if exists "Leitura pública dos PDFs" on storage.objects;
create policy "Leitura pública dos PDFs"
on storage.objects for select
to anon, authenticated
using (bucket_id in ('dissertacoes', 'atas-oficiais'));

drop policy if exists "Upload apenas pela presidência" on storage.objects;
create policy "Upload apenas pela presidência"
on storage.objects for insert
to authenticated
with check (
  bucket_id in ('dissertacoes', 'atas-oficiais')
  and public.sou_presidente()
);

drop policy if exists "Atualização apenas pela presidência" on storage.objects;
create policy "Atualização apenas pela presidência"
on storage.objects for update
to authenticated
using (bucket_id in ('dissertacoes', 'atas-oficiais') and public.sou_presidente())
with check (bucket_id in ('dissertacoes', 'atas-oficiais') and public.sou_presidente());

-- ---------------------------------------------------------------------
-- 9. APAGAR A SENHA EM TEXTO PURO
--    Só depois que o app novo (login via Supabase Auth) estiver no ar
--    e os 6 usuários existirem em Authentication → Users.
-- ---------------------------------------------------------------------
-- alter table public.membros_comissao drop column senha_acesso;

-- ---------------------------------------------------------------------
-- 10. RASCUNHO x FICHA CONCLUÍDA
--     A constraint atual exige somatorio >= 15, o que torna impossível
--     salvar rascunho parcial. O app passou a exigir os 15 itens para
--     gravar; se quiser permitir rascunho de verdade, troque por:
-- ---------------------------------------------------------------------
-- alter table public.avaliacoes drop constraint avaliacoes_somatorio_likert_75_check;
-- alter table public.avaliacoes add constraint avaliacoes_somatorio_likert_75_check
--   check (somatorio_likert_75 >= 0 and somatorio_likert_75 <= 75);
-- alter table public.avaliacoes add constraint avaliacoes_concluida_completa
--   check (not concluida or jsonb_array_length(
--            (select array_agg(k) from jsonb_object_keys(respostas_likert) k)
--          ) = 15);

-- ---------------------------------------------------------------------
-- 11. CONFERÊNCIA FINAL (deve falhar / vir vazio)
-- ---------------------------------------------------------------------
-- curl "$SUPABASE_URL/rest/v1/membros_comissao?select=*" -H "apikey: $ANON"
-- curl "$SUPABASE_URL/rest/v1/avaliacoes?select=*"      -H "apikey: $ANON"
-- curl -X PATCH "$SUPABASE_URL/rest/v1/avaliacoes?id=eq.<uuid>" \
--      -H "apikey: $ANON" -H "Content-Type: application/json" \
--      -d '{"nota_final_100":99}'
