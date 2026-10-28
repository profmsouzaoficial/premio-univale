import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DissertationSelector } from './components/DissertationSelector';
import { EvaluationForm } from './components/EvaluationForm';
import { ConsolidationView } from './components/ConsolidationView';
import { EditalView } from './components/EditalView';
import { CommissionModal } from './components/CommissionModal';
import { AtaModal } from './components/AtaModal';
import { LoginScreen } from './components/LoginScreen';
import { AtaOficialPdfMockup } from './components/AtaOficialPdfMockup';
import { Lock, Loader2 } from 'lucide-react';
import { DISSERTACOES_INDICADAS, AVALIADORES_PADRAO } from './data/dissertacoesData';
import { computeConsolidatedRanking } from './utils/evaluationUtils';
import { AvaliacaoDissertacao, Avaliador } from './types';
import { 
  carregarAvaliacoesSupabase, 
  carregarMembrosComissaoSupabase, 
  sincronizarMembrosComissaoSupabase, 
  atualizarSenhaMembroSupabase,
  supabase
} from './services/supabaseClient';


const STORAGE_AVALIACOES_KEY = 'ppg_git_avaliacoes_2025_v3';
const STORAGE_AVALIADORES_KEY = 'ppg_git_avaliadores_2025_v3';
const STORAGE_AUTH_KEY = 'ppg_git_auth_2025_v3';
const STORAGE_AVALIADOR_ID = 'ppg_git_avaliador_id_v3';
const STORAGE_IS_PRESIDENTE = 'ppg_git_is_presidente_v3';

export default function App() {
  // A sessão NUNCA é concedida por sessionStorage: ela é revalidada no Supabase Auth.
  const [autenticado, setAutenticado] = useState<boolean>(false);

  // Derivado do papel do membro autenticado (nunca de flag local)
  const [isPresidenteAutenticado, setIsPresidenteAutenticado] = useState<boolean>(false);

  const [restaurandoSessao, setRestaurandoSessao] = useState<boolean>(true);

  // Inicialização de avaliadores em ordem alfabética
  const [avaliadores, setAvaliadores] = useState<Avaliador[]>(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_AVALIADORES_KEY);
      if (salvo) return JSON.parse(salvo);
    } catch {
      // fallback
    }
    return AVALIADORES_PADRAO;
  });

  const [avaliadorAtivoId, setAvaliadorAtivoId] = useState<string>(() => {
    try {
      const salvoId = sessionStorage.getItem(STORAGE_AVALIADOR_ID);
      if (salvoId && AVALIADORES_PADRAO.some((a) => a.id === salvoId)) {
        return salvoId;
      }
    } catch {}
    const pres = AVALIADORES_PADRAO.find((a) => a.papel === 'presidente');
    return pres ? pres.id : AVALIADORES_PADRAO[0].id;
  });

  // Avaliações gerenciadas diretamente pelo Supabase (sem mockups para os avaliadores)
  const [avaliacoes, setAvaliacoes] = useState<Record<string, Record<string, AvaliacaoDissertacao>>>({});
  const [carregandoSupabase, setCarregandoSupabase] = useState<boolean>(false);

  const [dissertacaoSelecionadaId, setDissertacaoSelecionadaId] = useState<string>(
    DISSERTACOES_INDICADAS[0].id
  );

  const [abaAtiva, setAbaAtiva] = useState<'avaliacao' | 'consolidacao' | 'edital'>('avaliacao');
  const [modalComissaoAberto, setModalComissaoAberto] = useState<boolean>(false);
  const [modalAtaAberto, setModalAtaAberto] = useState<boolean>(false);
  const [modalAtaMockupAberto, setModalAtaMockupAberto] = useState<boolean>(false);
  const [toastMensagem, setToastMensagem] = useState<string | null>(null);

  const avaliadorAtivo =
    avaliadores.find((a) => a.id === avaliadorAtivoId) || avaliadores[0];

  // Presidência = membro autenticado cujo papel é 'presidente'.
  const isPresidente = autenticado && avaliadorAtivo?.papel === 'presidente';

  // Carregamento inicial da lista de membros do Supabase
  useEffect(() => {
    let ativo = true;
    async function carregarMembros() {
      const membrosDb = await carregarMembrosComissaoSupabase();
      if (ativo && membrosDb && membrosDb.length > 0) {
        setAvaliadores(membrosDb);
      }
    }
    carregarMembros();
    return () => { ativo = false; };
  }, []);

  // Revalida a sessão junto ao Supabase Auth. Sem sessão válida, volta ao login.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const email = data.session?.user?.email?.toLowerCase();
        if (ativo && email && avaliadores.length > 0) {
          const membro = avaliadores.find((a) => a.email?.toLowerCase() === email);
          if (membro) {
            setAvaliadorAtivoId(membro.id);
            setIsPresidenteAutenticado(membro.papel === 'presidente');
            setAutenticado(true);
          }
        }
      } catch (e) {
        console.warn('Não foi possível revalidar a sessão.', e);
      } finally {
        if (ativo) setRestaurandoSessao(false);
      }
    })();
    return () => { ativo = false; };
  }, [avaliadores]);

  // Carregamento de avaliações do Supabase para o avaliador ativo (ou todas se for o Presidente)
  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (!autenticado || !avaliadorAtivoId) return;
      setCarregandoSupabase(true);
      const isPres = isPresidente;
      const dados = await carregarAvaliacoesSupabase(avaliadorAtivoId, Boolean(isPres));
      if (ativo) {
        setAvaliacoes(dados);
        setCarregandoSupabase(false);
      }
    }
    carregar();
    return () => { ativo = false; };
  }, [autenticado, avaliadorAtivoId, isPresidente]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_AVALIADORES_KEY, JSON.stringify(avaliadores));
    } catch (e) {
      console.warn('Erro ao salvar avaliadores no localStorage', e);
    }
  }, [avaliadores]);

  const handleLoginSucesso = async (avaliador: Avaliador, isPres: boolean) => {
    setAvaliadorAtivoId(avaliador.id);
    setIsPresidenteAutenticado(isPres);
    setAutenticado(true);

    // Puxa as avaliações reais deste docente diretamente do Supabase
    setCarregandoSupabase(true);
    const dados = await carregarAvaliacoesSupabase(avaliador.id, isPres);
    setAvaliacoes(dados);
    setCarregandoSupabase(false);

    exibirToast(`Acesso concedido: ${avaliador.nome}${isPres ? ' (Presidente)' : ''}`);
  };

  const handleLogout = async () => {
    // Encerra também a sessão do Supabase Auth
    try { await supabase.auth.signOut(); } catch {}
    setAutenticado(false);
    setIsPresidenteAutenticado(false);
    setAvaliacoes({});
    exibirToast('Sessão encerrada com segurança.');
  };


  // A tela da Ata só é acessível ao presidente já autenticado.
  // Não existe mais credencial mestra: qualquer outra tentativa é recusada.
  const handleAutenticarPresidente = (_senha: string): boolean => false;

  const exibirToast = (msg: string) => {
    setToastMensagem(msg);
    setTimeout(() => setToastMensagem(null), 3500);
  };

  const handleSalvarAvaliacao = (novaAvaliacao: AvaliacaoDissertacao) => {
    setAvaliacoes((prev) => {
      const dissMap = prev[novaAvaliacao.dissertacaoId] || {};
      return {
        ...prev,
        [novaAvaliacao.dissertacaoId]: {
          ...dissMap,
          [novaAvaliacao.avaliadorId]: novaAvaliacao,
        },
      };
    });
    // O aviso de sucesso é emitido pelo formulário, somente após o Supabase confirmar.
  };

  const handleSalvarAvaliadores = async (novosAvaliadores: Avaliador[]) => {
    setAvaliadores(novosAvaliadores);
    try {
      localStorage.setItem(STORAGE_AVALIADORES_KEY, JSON.stringify(novosAvaliadores));
    } catch (e) {
      console.warn('Erro ao salvar avaliadores localmente:', e);
    }

    // Se o usuário logado teve sua presidência alterada, atualiza as permissões de sessão
    const souPresidente = novosAvaliadores.some(
      (a) => a.id === avaliadorAtivoId && a.papel === 'presidente'
    );
    setIsPresidenteAutenticado(souPresidente);
    try {
      sessionStorage.setItem(STORAGE_IS_PRESIDENTE, souPresidente ? 'true' : 'false');
    } catch {}

    // Sincroniza diretamente com o Supabase
    const res = await sincronizarMembrosComissaoSupabase(novosAvaliadores);
    if (res.success) {
      exibirToast('Comissão avaliadora atualizada e salva no Supabase!');
    } else {
      exibirToast('Alterações salvas localmente (execute o SQL no Supabase para sincronizar em nuvem).');
    }
  };

  const handleAtualizarSenha = async (avaliadorId: string, email: string, novaSenha: string) => {
    const res = await atualizarSenhaMembroSupabase(avaliadorId, email, novaSenha);
    if (res.success) {
      setAvaliadores((prev) =>
        prev.map((a) => (a.id === avaliadorId ? { ...a, senhaAcesso: novaSenha } : a))
      );
      exibirToast('Senha atualizada com sucesso no Supabase!');
    }
    return res;
  };

  // Navegação entre dissertações
  const indexAtual = DISSERTACOES_INDICADAS.findIndex((d) => d.id === dissertacaoSelecionadaId);

  const handleNavegar = (direcao: 'anterior' | 'proxima') => {
    if (direcao === 'anterior' && indexAtual > 0) {
      setDissertacaoSelecionadaId(DISSERTACOES_INDICADAS[indexAtual - 1].id);
    } else if (direcao === 'proxima' && indexAtual < DISSERTACOES_INDICADAS.length - 1) {
      setDissertacaoSelecionadaId(DISSERTACOES_INDICADAS[indexAtual + 1].id);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Avaliações do avaliador ativo
  const avaliacoesDoAvaliadorAtivo: Record<string, AvaliacaoDissertacao> = {};
  DISSERTACOES_INDICADAS.forEach((diss) => {
    if (avaliacoes[diss.id]?.[avaliadorAtivoId]) {
      avaliacoesDoAvaliadorAtivo[diss.id] = avaliacoes[diss.id][avaliadorAtivoId];
    }
  });

  const totalConcluidasDoAvaliador = Object.values(avaliacoesDoAvaliadorAtivo).filter(
    (a) => a && a.concluida
  ).length;

  const dissertacaoAtiva =
    DISSERTACOES_INDICADAS.find((d) => d.id === dissertacaoSelecionadaId) ||
    DISSERTACOES_INDICADAS[0];

  const avaliacaoAtiva = avaliacoes[dissertacaoAtiva.id]?.[avaliadorAtivoId];


  // Exportação local de dados para JSON
  const handleExportarDados = () => {
    const payload = {
      exportadoEm: new Date().toISOString(),
      edital: 'Edital UNIVALE Nº 115/2026',
      programa: 'PPG/GIT - Gestão Integrada do Território',
      avaliadores,
      avaliacoes,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `avaliacoes_premio_git_2025_${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
    exibirToast('Arquivo JSON exportado com sucesso!');
  };

  // Importação de dados de arquivo JSON
  const handleImportarDados = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const conteudo = event.target?.result as string;
        const parsed = JSON.parse(conteudo);

        if (parsed.avaliacoes) {
          setAvaliacoes(parsed.avaliacoes);
        }
        if (parsed.avaliadores && Array.isArray(parsed.avaliadores)) {
          setAvaliadores(parsed.avaliadores);
        }
        exibirToast('Dados importados com sucesso!');
      } catch {
        exibirToast('Erro ao importar JSON. Verifique o formato do arquivo.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRecarregarSupabase = async () => {
    setCarregandoSupabase(true);
    const isPres = isPresidente;
    const dados = await carregarAvaliacoesSupabase(avaliadorAtivoId, Boolean(isPres));
    setAvaliacoes(dados);
    setCarregandoSupabase(false);
    exibirToast('Avaliações atualizadas do Supabase!');
  };

  const handleLimparDados = () => {
    if (window.confirm('Tem certeza de que deseja limpar todas as avaliações locais?')) {
      setAvaliacoes({});
      exibirToast('Avaliações zeradas.');
    }
  };


  const rankingConsolidado = computeConsolidatedRanking(
    DISSERTACOES_INDICADAS,
    avaliadores,
    avaliacoes
  );

  // Enquanto o Supabase Auth não confirma a sessão, não exibimos nem login nem conteúdo
  if (restaurandoSessao) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center text-stone-400 text-sm gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
        Verificando credenciais…
      </div>
    );
  }

  if (!autenticado) {
    return (
      <LoginScreen
        avaliadores={avaliadores}
        onLoginSucesso={handleLoginSucesso}
      />
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/60 flex flex-col font-sans">
      {/* Toast Feedback */}
      {toastMensagem && (
        <div className="fixed top-4 right-4 z-50 bg-stone-900 text-stone-100 text-xs sm:text-sm font-medium px-4 py-2.5 rounded-xl shadow-xl border border-stone-700 animate-fade-in flex items-center gap-2">
          <span>{toastMensagem}</span>
        </div>
      )}

      {/* Institutional Header */}
      <Header
        abaAtiva={abaAtiva}
        setAbaAtiva={setAbaAtiva}
        avaliadores={avaliadores}
        avaliadorAtivo={avaliadorAtivo}
        onTrocarAvaliador={setAvaliadorAtivoId}
        abrirModalComissao={() => setModalComissaoAberto(true)}
        abrirModalEdital={() => setAbaAtiva('edital')}
        abrirModalAtaMockup={() => setModalAtaMockupAberto(true)}
        totalConcluidas={totalConcluidasDoAvaliador}
        onLogout={handleLogout}
        isPresidente={isPresidente}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {abaAtiva === 'avaliacao' && (
          <div>
            <DissertationSelector
              dissertacoes={DISSERTACOES_INDICADAS}
              dissertacaoSelecionadaId={dissertacaoSelecionadaId}
              onSelecionar={(id) => {
                setDissertacaoSelecionadaId(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              avaliacoesDoAvaliador={avaliacoesDoAvaliadorAtivo}
            />

            {carregandoSupabase ? (
              <div className="bg-white border border-stone-200 rounded-2xl p-10 text-center text-sm text-stone-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                Carregando as avaliações deste membro…
              </div>
            ) : (
              <EvaluationForm
                key={`${dissertacaoAtiva.id}-${avaliadorAtivo.id}`}
                dissertacao={dissertacaoAtiva}
                avaliador={avaliadorAtivo}
                avaliacao={avaliacaoAtiva}
                onSalvar={handleSalvarAvaliacao}
                onNavegar={handleNavegar}
                indexAtual={indexAtual}
                totalDissertacoes={DISSERTACOES_INDICADAS.length}
              />
            )}
          </div>
        )}

        {abaAtiva === 'consolidacao' && (
          isPresidente ? (
            <ConsolidationView
              dissertacoes={DISSERTACOES_INDICADAS}
              avaliadores={avaliadores}
              avaliacoes={avaliacoes}
              onAbrirAta={() => setModalAtaAberto(true)}
              onAbrirAtaMockup={() => setModalAtaMockupAberto(true)}
              isPresidente={true}
              onExportarDados={handleExportarDados}
              onImportarDados={handleImportarDados}
              onRecarregarSupabase={handleRecarregarSupabase}
              onLimparDados={handleLimparDados}
            />
          ) : (
            <div className="bg-white border border-stone-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 shadow-md space-y-4">
              <div className="w-12 h-12 mx-auto rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-serif font-bold text-stone-900">
                Acesso Restrito ao Presidente da Comissão
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Por determinação do Edital UNIVALE Nº 115/2026 e em respeito ao sigilo das notas entre os membros, a consolidação das avaliações e o ranking global é restrito exclusivamente ao Presidente da Comissão (<strong>Prof. Dr. Márcio Souza</strong>).
              </p>
              <button
                onClick={() => setAbaAtiva('avaliacao')}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                Voltar para Minhas Avaliações
              </button>
            </div>
          )
        )}

        {abaAtiva === 'edital' && <EditalView />}
      </main>

      {/* Modais */}
      <CommissionModal
        aberto={modalComissaoAberto}
        onFechar={() => setModalComissaoAberto(false)}
        avaliadores={avaliadores}
        avaliadorLogado={avaliadorAtivo}
        isPresidente={isPresidente}
        onSalvarAvaliadores={handleSalvarAvaliadores}
        onAtualizarSenha={handleAtualizarSenha}
      />

      <AtaModal
        aberto={modalAtaAberto}
        onFechar={() => setModalAtaAberto(false)}
        ranking={rankingConsolidado}
        avaliadores={avaliadores}
      />

      {/* Mockup da Ata Oficial com design para impressão A4 / PDF formatado */}
      <AtaOficialPdfMockup
        aberto={modalAtaMockupAberto}
        onFechar={() => setModalAtaMockupAberto(false)}
        ranking={rankingConsolidado}
        avaliadores={avaliadores}
        isPresidenteAutenticado={isPresidente}
        onAutenticarPresidente={handleAutenticarPresidente}
      />

      {/* Institutional Footer */}
      <footer className="bg-stone-900 text-stone-400 border-t border-stone-800 text-xs py-6 px-4 mt-12 print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-stone-300">
              Universidade Vale do Rio Doce – UNIVALE
            </span>{' '}
            · Fundação Percival Farquhar · PPG/GIT
            <p className="text-[11px] text-stone-500 mt-0.5">
              Prêmio de Melhor Dissertação do PPG/GIT de 2025 · Edital Nº 115/2026 · Governador Valadares/MG
            </p>
          </div>
          <div className="text-[11px] text-stone-500">
            Sigilo e conformidade com o regimento do PPG/GIT · Prazo: 19 de Novembro de 2026
          </div>
        </div>
      </footer>
    </div>
  );
}
