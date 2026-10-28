/**
 * Provisiona no Supabase Auth os membros da comissão que ainda não têm usuário.
 *
 * Contexto: após a correção, o login passa a ser validado exclusivamente pelo
 * Supabase Auth. Hoje só Andrey, Carlos e Márcio existem lá. Bruno, Franco e
 * Suely precisam ser criados, senão não conseguem entrar.
 *
 * Uso (NÃO comite a chave):
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/provision-auth-users.mjs
 *
 * A service_role key fica em: Supabase → Project Settings → API → service_role.
 * Ela ignora o RLS — use só neste script, no seu computador, e não a exponha.
 */

const SUPABASE_URL =
  process.env.SUPABASE_URL || 'https://pwusflbyvamjnfmuvagy.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('Faltou SUPABASE_SERVICE_ROLE_KEY no ambiente.');
  process.exit(1);
}

// Ajuste as senhas iniciais aqui. Peça a cada membro para trocar depois.
const MEMBROS = [
  { email: 'bruno.capile@univale.br', senha: 'premio', nome: 'Bruno Capilé' },
  { email: 'franco.araujo@univale.br', senha: 'premio', nome: 'Franco Araújo' },
  { email: 'suely.rodrigues@univale.br', senha: 'premio', nome: 'Suely Rodrigues' },
];

const headers = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
};

async function listarUsuarios() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=200`, { headers });
  if (!res.ok) throw new Error(`Falha ao listar usuários: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.users || [];
}

async function criarUsuario({ email, senha, nome }) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      email,
      password: senha,
      email_confirm: true, // já entra confirmado, sem depender de e-mail
      user_metadata: { name: nome },
    }),
  });
  const corpo = await res.text();
  if (!res.ok) return { ok: false, erro: `${res.status} ${corpo}` };
  return { ok: true, id: JSON.parse(corpo).id };
}

const usuarios = await listarUsuarios();
const existentes = new Set(usuarios.map((u) => (u.email || '').toLowerCase()));
console.log(`Usuários hoje no Auth: ${usuarios.length}`);

for (const membro of MEMBROS) {
  const email = membro.email.toLowerCase();
  if (existentes.has(email)) {
    console.log(`= ${email} já existe, nada a fazer`);
    continue;
  }
  const r = await criarUsuario(membro);
  console.log(r.ok ? `+ ${email} criado (${r.id})` : `! ${email} falhou: ${r.erro}`);
}

console.log('\nConfira em Authentication → Users se os 6 estão lá.');
console.log('Depois, alinhe o e-mail de membros_comissao com o do Auth:');
console.log('  select id, email from public.membros_comissao order by id;');
