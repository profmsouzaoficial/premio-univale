import { createClient } from '@supabase/supabase-js';
import { Avaliador } from '../types';

export const SUPABASE_URL = 
  import.meta.env.VITE_SUPABASE_URL || 'https://pwusflbyvamjnfmuvagy.supabase.co';

export const SUPABASE_ANON_KEY = 
  import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3dXNmbGJ5dmFtam5mbXV2YWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMxMjMxMjIsImV4cCI6MjEwODY5OTEyMn0.hFVDXcREuA4Fskv0IKngrNJ4fwA_ujj2AgKjYBUKpZM';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Autenticação com Supabase Auth
export async function autenticarProfessorSupabase(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.warn('Supabase Auth warning:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, session: data.session, user: data.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// Helper para obter URL pública de arquivo no bucket do Supabase Storage
export function getStoragePublicUrl(bucket: string, path: string): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

// URLs fixas dos PDFs homologadas no Supabase Storage do projeto
export const SUPABASE_STORAGE_URLS = {
  edital: getStoragePublicUrl('dissertacoes', 'edital_univale_115_2026.pdf'),
  dissertacoes: {
    'santos-guilherme': getStoragePublicUrl('dissertacoes', 'Guilherme_Rodrigues_dos_Santos.pdf'),
    'silva-henrique': getStoragePublicUrl('dissertacoes', 'Henrique_Bianor_Freitas_Silva.pdf'),
    'martins-luciana': getStoragePublicUrl('dissertacoes', 'Luciana_da_Cunha_Pereira_Martins.pdf'),
    'santana-girley': getStoragePublicUrl('dissertacoes', 'Girley_Batista_Santana.pdf'),
  },
};

// Logotipo oficial da UNIVALE fornecido pelo usuário (mantido para Ata e documentos oficiais)
export const LOGO_UNIVALE_URL = 'https://univale.br/wp-content/uploads/2022/08/Marca-Univale_Prancheta-1-scaled.jpg';

// Imagem oficial do Troféu armazenada no bucket 'images' do Supabase para o header do webapp
export const TROFEU_IMAGE_URL = 'https://pwusflbyvamjnfmuvagy.supabase.co/storage/v1/object/public/images/trofeu.jpeg';

// Carregar avaliações do Supabase (com filtro estrito de privacidade por avaliador)
export async function carregarAvaliacoesSupabase(
  avaliadorId?: string,
  isPresidente: boolean = false
): Promise<Record<string, Record<string, any>>> {
  try {
    let query = supabase.from('avaliacoes').select('*');

    // Se NÃO for presidente, puxa APENAS as avaliações deste professor específico
    if (!isPresidente && avaliadorId) {
      query = query.eq('avaliador_id', avaliadorId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Erro ao carregar avaliações do Supabase:', error.message);
      return {};
    }

    const mapa: Record<string, Record<string, any>> = {};
    if (data && Array.isArray(data)) {
      data.forEach((row) => {
        const dId = row.dissertacao_id;
        const avId = row.avaliador_id;
        if (!mapa[dId]) mapa[dId] = {};

        const c1 = Number(row.pontos_criterio_1) || 0;
        const c2 = Number(row.pontos_criterio_2) || 0;
        const c3 = Number(row.pontos_criterio_3) || 0;
        const c4 = Number(row.pontos_criterio_4) || 0;
        const c5 = Number(row.pontos_criterio_5) || 0;

        mapa[dId][avId] = {
          dissertacaoId: dId,
          avaliadorId: avId,
          likertRespostas: row.respostas_likert || {},
          somasCriterios: { 1: c1, 2: c2, 3: c3, 4: c4, 5: c5 },
          mediasCriterios: {
            1: Number((c1 / 3).toFixed(2)) || 0,
            2: Number((c2 / 3).toFixed(2)) || 0,
            3: Number((c3 / 3).toFixed(2)) || 0,
            4: Number((c4 / 3).toFixed(2)) || 0,
            5: Number((c5 / 3).toFixed(2)) || 0,
          },
          somatorioLikert75: Number(row.somatorio_likert_75) || 0,
          notaLivre25: Number(row.nota_livre_25) || 0,
          notaFinal100: Number(row.nota_final_100) || 0,
          comentariosGerais: row.comentarios_gerais || '',
          pontosFortes: row.pontos_fortes || '',
          oportunidadesMelhoria: row.oportunidades_melhoria || '',
          indicacaoMencaoHonrosa: Boolean(row.mencao_honrosa),
          concluida: Boolean(row.concluida),
          atualizadoEm: row.updated_at || row.created_at,
        };
      });
    }
    return mapa;
  } catch (err: unknown) {
    console.warn('Falha na consulta ao Supabase:', err);
    return {};
  }
}

// Sincronizar uma avaliação no Supabase
export async function sincronizarAvaliacaoSupabase(avaliacao: {
  dissertacaoId: string;
  avaliadorId: string;
  respostasLikert: Record<string, number>;
  somasCriterios: Record<string | number, number>;
  somatorioLikert75: number;
  notaLivre25: number;
  notaFinal100: number;
  notaEscalaEdital5: number;
  mencaoHonrosa: boolean;
  comentariosGerais: string;
  pontosFortes?: string;
  oportunidadesMelhoria?: string;
  concluida: boolean;
}) {
  try {
    const p1 = Math.max(3, Math.min(15, Number(avaliacao.somasCriterios[1] ?? avaliacao.somasCriterios['c1']) || 3));
    const p2 = Math.max(3, Math.min(15, Number(avaliacao.somasCriterios[2] ?? avaliacao.somasCriterios['c2']) || 3));
    const p3 = Math.max(3, Math.min(15, Number(avaliacao.somasCriterios[3] ?? avaliacao.somasCriterios['c3']) || 3));
    const p4 = Math.max(3, Math.min(15, Number(avaliacao.somasCriterios[4] ?? avaliacao.somasCriterios['c4']) || 3));
    const p5 = Math.max(3, Math.min(15, Number(avaliacao.somasCriterios[5] ?? avaliacao.somasCriterios['c5']) || 3));

    const { error } = await supabase
      .from('avaliacoes')
      .upsert(
        {
          dissertacao_id: avaliacao.dissertacaoId,
          avaliador_id: avaliacao.avaliadorId,
          respostas_likert: avaliacao.respostasLikert,
          pontos_criterio_1: p1,
          pontos_criterio_2: p2,
          pontos_criterio_3: p3,
          pontos_criterio_4: p4,
          pontos_criterio_5: p5,
          somatorio_likert_75: avaliacao.somatorioLikert75,
          nota_livre_25: avaliacao.notaLivre25,
          nota_final_100: avaliacao.notaFinal100,
          nota_escala_edital_5: avaliacao.notaEscalaEdital5,
          mencao_honrosa: avaliacao.mencaoHonrosa,
          comentarios_gerais: avaliacao.comentariosGerais,
          concluida: avaliacao.concluida,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'dissertacao_id,avaliador_id' }
      );
    
    if (error) {
      console.warn('Supabase sync warning (avaliacoes):', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.warn('Erro ao conectar ao Supabase:', message);
    return { success: false, error: message };
  }
}


// Salvar Ata Oficial homologada no Supabase
export async function registrarAtaHomologadaSupabase(dadosAta: {
  presidenteId: string;
  vencedoraDissertacaoId: string;
  mencaoHonrosaDissertacaoId?: string;
  rankingConsolidado: unknown;
  hashAutenticidade: string;
  observacoesPresidencia?: string;
}) {
  try {
    const { data, error } = await supabase
      .from('atas_homologadas')
      .insert({
        edital_numero: '115/2026',
        ano_premio: 2025,
        presidente_id: dadosAta.presidenteId,
        vencedora_dissertacao_id: dadosAta.vencedoraDissertacaoId,
        mencao_honrosa_dissertacao_id: dadosAta.mencaoHonrosaDissertacaoId,
        ranking_consolidado: dadosAta.rankingConsolidado,
        hash_autenticidade: dadosAta.hashAutenticidade,
        observacoes_presidencia: dadosAta.observacoesPresidencia,
      })
      .select()
      .single();

    if (error) {
      console.warn('Erro ao salvar ata no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// Carregar lista de membros da comissão avaliadora do Supabase
export async function carregarMembrosComissaoSupabase(): Promise<Avaliador[] | null> {
  try {
    const { data, error } = await supabase
      .from('membros_comissao')
      .select('*')
      .order('nome', { ascending: true });

    if (error) {
      console.warn('Tabela membros_comissao indisponível ou vazia no Supabase:', error.message);
      return null;
    }

    if (data && data.length > 0) {
      return data.map((row: any) => ({
        id: row.id,
        nome: row.nome,
        titulacao: row.titulacao || 'Dr.',
        instituicao: row.instituicao,
        papel: row.papel === 'presidente' ? 'presidente' : 'avaliador',
        email: row.email,
        telefone: row.telefone || '',
        // A senha nunca é carregada para o cliente: a autenticação é feita no Supabase Auth.
      }));
    }
    return null;
  } catch (err) {
    console.warn('Erro ao carregar membros do Supabase:', err);
    return null;
  }
}

// Salvar / Sincronizar todos os membros da comissão no Supabase
export async function sincronizarMembrosComissaoSupabase(
  membros: Avaliador[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = membros.map((m, index) => ({
      id: m.id,
      nome: m.nome,
      titulacao: m.titulacao,
      instituicao: m.instituicao,
      papel: m.papel,
      email: m.email,
      telefone: m.telefone || null,
      senha_acesso: m.senhaAcesso,
      ordem: index + 1,
      updated_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from('membros_comissao')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Erro ao sincronizar membros no Supabase:', error.message);
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

// Atualizar senha do avaliador no Supabase (tanto em membros_comissao quanto no Supabase Auth)
export async function atualizarSenhaMembroSupabase(
  avaliadorId: string,
  email: string,
  novaSenha: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Atualiza na tabela membros_comissao
    const { error: dbError } = await supabase
      .from('membros_comissao')
      .update({
        senha_acesso: novaSenha,
        updated_at: new Date().toISOString(),
      })
      .eq('id', avaliadorId);

    if (dbError) {
      console.warn('Aviso ao atualizar senha na tabela membros_comissao:', dbError.message);
    }

    // 2. Se houver sessão ativa no Supabase Auth, atualiza a senha do usuário
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: novaSenha,
      });
      if (authError) {
        console.warn('Aviso do Supabase Auth updateUser:', authError.message);
      }
    } catch {
      // Ignora se não houver sessão ativa do Supabase Auth
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, error: message };
  }
}

