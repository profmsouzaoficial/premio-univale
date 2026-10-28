import React, { useState } from 'react';
import { 
  ExternalLink, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Save, 
  ArrowLeft, 
  ArrowRight, 
  Award, 
  FileCheck,
  ChevronDown,
  ChevronUp,
  Info,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  History
} from 'lucide-react';

import { Dissertacao, AvaliacaoDissertacao, Avaliador } from '../types';
import { CRITERIOS_AVALIACAO, LIKERT_ESCALA } from '../data/criteriosData';
import { calculateEvaluationScores } from '../utils/evaluationUtils';
import { sincronizarAvaliacaoSupabase } from '../services/supabaseClient';

interface EvaluationFormProps {
  dissertacao: Dissertacao;
  avaliador: Avaliador;
  avaliacao: AvaliacaoDissertacao | undefined;
  onSalvar: (novaAvaliacao: AvaliacaoDissertacao) => void;
  onNavegar: (direcao: 'anterior' | 'proxima') => void;
  indexAtual: number;
  totalDissertacoes: number;
}

export const EvaluationForm: React.FC<EvaluationFormProps> = ({
  dissertacao,
  avaliador,
  avaliacao,
  onSalvar,
  onNavegar,
  indexAtual,
  totalDissertacoes,
}) => {
  // Inicialização do estado local baseado na avaliação existente ou padrão
  const [respostas, setRespostas] = useState<Record<string, number>>(
    avaliacao?.likertRespostas || {}
  );

  // Nota livre de 0 a 25 pontos (conforme solicitação expressa do usuário)
  const [notaLivre25, setNotaLivre25] = useState<number>(() => {
    if (avaliacao?.notaLivre25 !== undefined) return avaliacao.notaLivre25;
    return 20; // sugestão inicial padrão de 0 a 25
  });

  const [comentariosGerais, setComentariosGerais] = useState<string>(
    avaliacao?.comentariosGerais || ''
  );

  const [pontosFortes, setPontosFortes] = useState<string>(
    avaliacao?.pontosFortes || ''
  );

  const [oportunidadesMelhoria, setOportunidadesMelhoria] = useState<string>(
    avaliacao?.oportunidadesMelhoria || ''
  );

  const [indicacaoMencao, setIndicacaoMencao] = useState<boolean>(
    avaliacao?.indicacaoMencaoHonrosa || false
  );

  const [justificativaMencao, setJustificativaMencao] = useState<string>(
    avaliacao?.justificativaMencaoHonrosa || ''
  );

  const [salvoFeedback, setSalvoFeedback] = useState<boolean>(false);
  const [visualizadorPdfAberto, setVisualizadorPdfAberto] = useState<boolean>(false);
  const [secoesAbertas, setSecoesAbertas] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
  });

  // Recalcula scores em tempo real com a nova fórmula:
  // Somatório Likert (15 a 75) + Nota Livre (0 a 25) = Total (15 a 100)
  const { somasCriterios, mediasCriterios, somatorioLikert75, notaFinal100, totalRespondidas } =
    calculateEvaluationScores(respostas, notaLivre25);

  const isCompleto = totalRespondidas === 15;

  const handleLikertChange = (subId: string, valor: number) => {
    const novasRespostas = { ...respostas, [subId]: valor };
    setRespostas(novasRespostas);
  };

  const toggleSecao = (id: number) => {
    setSecoesAbertas((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSalvar = (marcarConcluida: boolean = false) => {
    const avaliacaoAtualizada: AvaliacaoDissertacao = {
      dissertacaoId: dissertacao.id,
      avaliadorId: avaliador.id,
      likertRespostas: respostas,
      somasCriterios,
      mediasCriterios,
      somatorioLikert75,
      notaLivre25: Number(notaLivre25),
      notaFinal100: Number(notaFinal100),
      comentariosGerais,
      pontosFortes,
      oportunidadesMelhoria,
      indicacaoMencaoHonrosa: indicacaoMencao,
      justificativaMencaoHonrosa: justificativaMencao,
      atualizadoEm: new Date().toISOString(),
      concluida: marcarConcluida ? true : (avaliacao?.concluida ?? isCompleto),
    };

    onSalvar(avaliacaoAtualizada);
    setSalvoFeedback(true);
    setTimeout(() => setSalvoFeedback(false), 2800);

    // Sincroniza em segundo plano com o banco de dados Supabase
    sincronizarAvaliacaoSupabase({
      dissertacaoId: dissertacao.id,
      avaliadorId: avaliador.id,
      respostasLikert: respostas,
      somasCriterios,
      somatorioLikert75,
      notaLivre25: Number(notaLivre25),
      notaFinal100: Number(notaFinal100),
      notaEscalaEdital5: Number(((notaFinal100 / 100) * 5).toFixed(2)),
      mencaoHonrosa: indicacaoMencao,
      comentariosGerais,
      concluida: marcarConcluida ? true : (avaliacao?.concluida ?? isCompleto),
    });
  };

  const avaliacaoJaRealizada = Boolean(
    avaliacao && (avaliacao.concluida || Object.keys(avaliacao.likertRespostas || {}).length > 0)
  );

  return (
    <div className="space-y-6">
      {/* Mensagem de Aviso caso o Professor já tenha avaliado a dissertação */}
      {avaliacaoJaRealizada && (
        <div className="bg-emerald-50 border-2 border-emerald-400/90 rounded-2xl p-4 sm:p-5 shadow-sm text-stone-900 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5 md:mt-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-emerald-950 font-serif">
                  Atenção: Você já avaliou esta dissertação
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-mono font-bold text-xs border border-emerald-300">
                  Nota Registrada: {avaliacao?.notaFinal100?.toFixed(1) || notaFinal100.toFixed(1)} / 100 pts
                </span>
                {avaliacao?.indicacaoMencaoHonrosa && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 font-semibold text-xs border border-amber-300">
                    ★ Indicada para Menção Honrosa
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-emerald-900/90 leading-relaxed">
                Conforme o regulamento do Prêmio, cada professor avalia cada dissertação uma única vez. Seus dados e notas já se encontram salvos no sistema
                {avaliacao?.atualizadoEm ? ` (último registro em ${new Date(avaliacao.atualizadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })})` : ''}.
                Você pode revisar seus apontamentos abaixo e, caso deseje retificar algum critério ou nota, altere os campos e clique em <strong>"Atualizar Avaliação Salva"</strong>.
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2 self-end md:self-center">
            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-700" />
              Edição Habilitada
            </span>
          </div>
        </div>
      )}

      {/* Banner da Dissertação Selecionada com Acesso Direto aos PDFs anexados */}
      <div className="bg-white border border-stone-200/90 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-5">
          <div className="space-y-2.5 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500">
              <span className="font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                Dissertação {indexAtual + 1} de {totalDissertacoes}
              </span>

              <span aria-hidden="true">·</span>
              <span className="text-stone-700 font-medium">{dissertacao.laboratorio}</span>
              <span aria-hidden="true">·</span>
              <span>Ano {dissertacao.ano}</span>
              {dissertacao.paginas && (
                <>
                  <span aria-hidden="true">·</span>
                  <span>{dissertacao.paginas} páginas</span>
                </>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-serif font-bold text-stone-900 leading-snug">
              {dissertacao.titulo}
            </h2>

            <p className="text-sm font-medium text-stone-700">
              Autor(a): <span className="font-bold text-stone-900 text-base">{dissertacao.autor}</span>
            </p>

            {dissertacao.resumoBreve && (
              <p className="text-xs sm:text-sm text-stone-600 bg-stone-50 p-3.5 rounded-lg border border-stone-200/60 leading-relaxed italic">
                {dissertacao.resumoBreve}
              </p>
            )}

            {/* Links para os anexos PDF anexados pelo usuário */}
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setVisualizadorPdfAberto(!visualizadorPdfAberto)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 px-3.5 py-2 rounded-lg transition-colors shadow-sm"
              >
                {visualizadorPdfAberto ? <EyeOff className="w-4 h-4 text-amber-400" /> : <Eye className="w-4 h-4 text-amber-400" />}
                <span>{visualizadorPdfAberto ? 'Ocultar Leitor PDF' : 'Ler Dissertação Integrada (PDF Anexo)'}</span>
              </button>

              <a
                href={dissertacao.supabaseStorageUrl || dissertacao.pdfLocalPath}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 px-3.5 py-2 rounded-lg border border-amber-300 transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-700" />
                <span>Abrir PDF no Supabase Storage</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href={dissertacao.linkAcesso}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-2 rounded-lg border border-stone-300 transition-colors"
              >
                <span>Repositório Pergamum/UNIVALE</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Quick Score Board: Likert (15-75) + Nota Livre (0-25) = Total (100) */}
          <div className="lg:w-80 bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col justify-between shrink-0 shadow-xs">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-stone-500">
                <span>Progresso Likert:</span>
                {isCompleto ? (
                  <span className="font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> 15/15 Afirmações
                  </span>
                ) : (
                  <span className="font-semibold text-amber-700 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> {totalRespondidas}/15 respondidos
                  </span>
                )}
              </div>

              <div className="w-full bg-stone-200 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${
                    isCompleto ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${(totalRespondidas / 15) * 100}%` }}
                />
              </div>

              {/* Box de detalhamento da soma: 75 + 25 = 100 */}
              <div className="pt-2 border-t border-stone-200 space-y-1.5 text-xs">
                <div className="flex justify-between items-baseline">
                  <span className="text-stone-600">Somatório Likert (15 itens):</span>
                  <span className="font-mono text-sm font-bold text-stone-900">
                    {somatorioLikert75} <span className="text-[11px] text-stone-400 font-normal">/ 75 pts</span>
                  </span>
                </div>

                <div className="flex justify-between items-baseline">
                  <span className="text-stone-600">Nota Livre Docente:</span>
                  <span className="font-mono text-sm font-bold text-amber-700">
                    +{notaLivre25.toFixed(1)} <span className="text-[11px] text-stone-400 font-normal">/ 25 pts</span>
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-stone-300">
                  <div>
                    <span className="text-xs font-bold text-stone-900 block">Nota Final Oficial:</span>
                    <span className="text-[10px] text-stone-500">Likert (75) + Livre (25)</span>
                  </div>
                  <span className="font-mono text-2xl font-black text-amber-800">
                    {notaFinal100.toFixed(1)}
                    <span className="text-xs text-stone-500 font-normal"> / 100</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stone-200 flex flex-col gap-2">
              <button
                onClick={() => handleSalvar(true)}
                className="w-full py-2.5 px-3 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Salvar Avaliação da Dissertação</span>
              </button>
              {salvoFeedback && (
                <span className="text-center text-xs text-emerald-700 font-medium flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Gravado com sucesso!
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Leitor embutido da dissertação se acionado */}
        {visualizadorPdfAberto && (
          <div className="mt-5 pt-4 border-t border-stone-200 space-y-2">
            <div className="flex items-center justify-between text-xs text-stone-600">
              <span className="font-semibold text-stone-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-amber-600" />
                Documento da Dissertação em Leitura: {dissertacao.autor}
              </span>
              <a
                href={dissertacao.supabaseStorageUrl || dissertacao.pdfLocalPath}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 hover:text-amber-800 underline font-medium flex items-center gap-1"
              >
                <span>Tela Cheia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="w-full h-[600px] bg-stone-100 rounded-xl overflow-hidden border border-stone-300">
              <iframe
                src={`${dissertacao.supabaseStorageUrl || dissertacao.pdfLocalPath}#view=FitH`}
                title={dissertacao.titulo}
                className="w-full h-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Orientação Metodológica da Nota de 100 pontos */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs sm:text-sm text-stone-700 flex items-start gap-3">
        <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-stone-900">
            Estrutura de Pontuação da Comissão (Total: 0 a 100 pontos):
          </p>
          <p className="text-xs text-stone-600 leading-relaxed">
            • <strong>Escala Likert (15 a 75 pontos):</strong> Somatório direto dos pesos individuais das 15 afirmações (cada uma avaliada de 1 a 5).
            <br />
            • <strong>Nota Livre do Professor (0 a 25 pontos):</strong> Atribuída no painel abaixo para complementar o julgamento qualitativo.
            <br />
            • <strong>Nota Final Máxima = 75 + 25 = 100 pontos.</strong>
          </p>
        </div>
      </div>

      {/* Critérios de Avaliação (1 a 5) com as 15 afirmações */}
      <div className="space-y-5">
        {CRITERIOS_AVALIACAO.map((criterio) => {
          const aberto = secoesAbertas[criterio.id] ?? true;
          const somaCriterio = somasCriterios[criterio.id] || 0;
          const mediaCriterio = mediasCriterios[criterio.id] || 0;
          const respondidosNesteCriterio = criterio.subcriterios.filter(
            (s) => respostas[s.id] !== undefined
          ).length;

          return (
            <div
              key={criterio.id}
              className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm transition-all"
            >
              {/* Header do Critério */}
              <button
                type="button"
                onClick={() => toggleSecao(criterio.id)}
                className="w-full px-5 py-4 bg-stone-50/80 hover:bg-stone-100/80 border-b border-stone-200 flex items-center justify-between gap-4 text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-lg bg-stone-900 text-stone-100 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                    {criterio.numero}
                  </span>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                      {criterio.nome}
                    </h3>
                    <p className="text-xs text-stone-500 line-clamp-1">{criterio.descricao}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <span className="text-xs text-stone-500">Subtotal Likert:</span>
                    <span className="ml-1.5 font-mono text-sm font-bold text-amber-700">
                      {somaCriterio > 0 ? somaCriterio : '—'}
                      <span className="text-xs text-stone-400 font-normal"> / 15 pts</span>
                    </span>
                    <span className="ml-2 text-[11px] text-stone-400 font-mono">
                      (méd. {mediaCriterio > 0 ? mediaCriterio.toFixed(2) : '—'})
                    </span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-stone-200/80 text-stone-700 font-mono">
                    {respondidosNesteCriterio}/3
                  </span>
                  {aberto ? (
                    <ChevronUp className="w-4 h-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </div>
              </button>

              {/* Subcritérios e Likert */}
              {aberto && (
                <div className="p-5 divide-y divide-stone-100 space-y-5">
                  {criterio.subcriterios.map((sub, idx) => {
                    const valorAtual = respostas[sub.id];

                    return (
                      <div
                        key={sub.id}
                        className={`${idx > 0 ? 'pt-5' : ''} space-y-3`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                          <div className="space-y-1 flex-1">
                            <span className="text-xs font-mono font-semibold text-amber-800">
                              Subcritério {sub.id} · {sub.titulo}
                            </span>
                            <p className="text-sm text-stone-800 font-medium leading-relaxed">
                              {sub.afirmacao}
                            </p>
                          </div>

                          {valorAtual && (
                            <span className="text-xs font-mono px-2 py-1 bg-stone-100 text-stone-700 rounded self-start shrink-0">
                              Pontos: <strong>{valorAtual}</strong> / 5
                            </span>
                          )}
                        </div>

                        {/* Likert Scale Buttons (1 a 5) */}
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                          {LIKERT_ESCALA.map((opcao) => {
                            const isSelected = valorAtual === opcao.valor;

                            return (
                              <button
                                key={opcao.valor}
                                type="button"
                                onClick={() => handleLikertChange(sub.id, opcao.valor)}
                                className={`text-left p-3 rounded-lg border text-xs transition-all relative flex sm:flex-col justify-between sm:justify-start gap-1 ${
                                  isSelected
                                    ? `${opcao.cor} ring-2 ring-stone-900 shadow-sm font-semibold`
                                    : 'border-stone-200 bg-stone-50/50 hover:bg-white text-stone-700'
                                }`}
                              >
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className={`w-5 h-5 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                                      isSelected
                                        ? 'bg-stone-900 text-white'
                                        : 'bg-stone-200 text-stone-700'
                                    }`}
                                  >
                                    {opcao.valor}
                                  </span>
                                  <span className="font-semibold text-xs leading-tight">
                                    {opcao.label}
                                  </span>
                                </div>
                                <span className="text-[11px] text-stone-500 font-normal leading-tight hidden sm:block mt-1">
                                  {opcao.desc}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Painel da Nota Livre do Professor (0 a 25 pontos) */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Nota Livre do Professor (0 a 25 pontos)
            </h3>
          </div>
          <span className="text-xs font-mono bg-stone-100 text-stone-700 px-2.5 py-1 rounded-md border border-stone-200">
            Escala: 0 a 25 pontos
          </span>
        </div>

        <p className="text-xs text-stone-600">
          Conforme diretriz da comissão, o somatório da escala Likert (15 a 75 pontos) soma-se à sua <strong>Nota Livre (0 a 25 pontos)</strong>, totalizando até 100 pontos máximos na avaliação desta dissertação.
        </p>

        <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-stone-800 block">
              Atribua a pontuação livre para esta dissertação (0 a 25):
            </label>
            <span className="text-[11px] text-stone-500">
              Valor discricionário do avaliador baseado na relevância global e mérito da pesquisa.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min="0"
              max="25"
              step="0.5"
              value={notaLivre25}
              onChange={(e) => {
                const val = Math.max(0, Math.min(25, Number(e.target.value)));
                setNotaLivre25(val);
              }}
              className="w-24 font-mono text-2xl font-bold text-stone-900 bg-white border-2 border-amber-400 rounded-lg px-2 py-1 text-center focus:ring-2 focus:ring-amber-500 focus:outline-none shadow-inner"
            />
            <span className="text-xs text-stone-500 font-mono font-semibold">/ 25 pts</span>
          </div>
        </div>

        {/* Resumo Final Integrado */}
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
          <div className="p-2 bg-white rounded-lg border border-stone-200">
            <span className="text-[11px] text-stone-500 uppercase block font-semibold">
              1. Somatório Likert (15 itens)
            </span>
            <span className="font-mono text-xl font-bold text-stone-800">
              {somatorioLikert75} <span className="text-xs text-stone-400 font-normal">/ 75</span>
            </span>
          </div>

          <div className="p-2 bg-white rounded-lg border border-stone-200">
            <span className="text-[11px] text-stone-500 uppercase block font-semibold">
              2. Nota Livre do Professor
            </span>
            <span className="font-mono text-xl font-bold text-amber-700">
              {notaLivre25.toFixed(1)} <span className="text-xs text-stone-400 font-normal">/ 25</span>
            </span>
          </div>

          <div className="p-2 bg-amber-100/60 rounded-lg border border-amber-300">
            <span className="text-[11px] text-amber-900 uppercase block font-bold">
              Total Oficial da Dissertação
            </span>
            <span className="font-mono text-2xl font-black text-amber-900">
              {notaFinal100.toFixed(1)} <span className="text-xs text-stone-600 font-normal">/ 100 pts</span>
            </span>
          </div>
        </div>
      </div>

      {/* Parecer Descritivo e Comentários Gerais */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <FileCheck className="w-5 h-5 text-stone-700" />
          <h3 className="font-serif font-bold text-stone-900 text-lg">
            Parecer Descritivo & Comentários Gerais do Avaliador
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              Comentários Gerais sobre a Dissertação (Justificativa da Pontuação) *
            </label>
            <textarea
              rows={4}
              value={comentariosGerais}
              onChange={(e) => setComentariosGerais(e.target.value)}
              placeholder="Descreva a fundamentação do julgamento, aspectos do rigor analítico, maturidade e contribuições para o campo de Gestão Integrada do Território..."
              className="w-full text-xs sm:text-sm p-3 bg-stone-50 border border-stone-300 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800 leading-relaxed placeholder:text-stone-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Pontos Fortes e Destaques da Pesquisa (Opcional)
              </label>
              <textarea
                rows={2}
                value={pontosFortes}
                onChange={(e) => setPontosFortes(e.target.value)}
                placeholder="Ex: Originalidade epistemológica, profundidade etnográfica, impacto comunitário..."
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Oportunidades de Desdobramento / Publicação (Opcional)
              </label>
              <textarea
                rows={2}
                value={oportunidadesMelhoria}
                onChange={(e) => setOportunidadesMelhoria(e.target.value)}
                placeholder="Ex: Potencial para publicação em periódico Qualis A1, livro pela UNIVALE Editora..."
                className="w-full text-xs p-2.5 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-800"
              />
            </div>
          </div>
        </div>

        {/* Indicação de Menção Honrosa (Art. 3.4 do Edital) */}
        <div className="pt-4 border-t border-stone-100">
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="mencao-honrosa"
                checked={indicacaoMencao}
                onChange={(e) => setIndicacaoMencao(e.target.checked)}
                className="mt-1 w-4 h-4 text-amber-600 rounded border-stone-300 focus:ring-amber-500 cursor-pointer"
              />
              <div className="flex-1">
                <label htmlFor="mencao-honrosa" className="font-semibold text-stone-900 text-xs sm:text-sm cursor-pointer flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>Indico esta dissertação para concorrer à Menção Honrosa (Edital Art. 3.4)</span>
                </label>
                <p className="text-xs text-stone-600 mt-0.5">
                  "A comissão de avaliação poderá decidir pela atribuição, ou não, de uma menção honrosa ao segundo colocado da pontuação final."
                </p>
              </div>
            </div>

            {indicacaoMencao && (
              <div className="pl-7 pt-2">
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Justificativa para atribuição da Menção Honrosa:
                </label>
                <input
                  type="text"
                  value={justificativaMencao}
                  onChange={(e) => setJustificativaMencao(e.target.value)}
                  placeholder="Justifique o mérito diferenciado para a honraria caso não seja a 1ª colocada..."
                  className="w-full text-xs p-2 bg-white border border-stone-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Barra Inferior de Ações e Navegação */}
      <div className="sticky bottom-3 z-30 bg-stone-900 text-white rounded-xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 border border-stone-700">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onNavegar('anterior')}
            disabled={indexAtual === 0}
            className="px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Anterior</span>
          </button>

          <span className="text-xs text-stone-400 font-medium px-2">
            Dissertação {indexAtual + 1} de {totalDissertacoes}
          </span>

          <button
            type="button"
            onClick={() => onNavegar('proxima')}
            disabled={indexAtual === totalDissertacoes - 1}
            className="px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center gap-1 transition-colors"
          >
            <span>Próxima</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleSalvar(false)}
            className="px-4 py-2 text-xs font-medium text-stone-200 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-600 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-stone-400" />
            <span>Salvar Rascunho</span>
          </button>

          <button
            type="button"
            onClick={() => {
              handleSalvar(true);
              if (indexAtual < totalDissertacoes - 1) {
                onNavegar('proxima');
              }
            }}
            className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>
              {avaliacaoJaRealizada ? 'Atualizar Avaliação Salva' : 'Concluir Avaliação'}{' '}
              {indexAtual < totalDissertacoes - 1 ? '& Próxima →' : '✓'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
