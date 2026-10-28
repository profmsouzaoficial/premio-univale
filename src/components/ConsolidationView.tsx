import React, { useState } from 'react';
import { 
  Award, 
  Printer, 
  Download, 
  Upload, 
  Mail, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  FileText,
  CheckCircle2, 
  Info,
  Gavel,
  Lock,
  RefreshCw,
} from 'lucide-react';

import { Dissertacao, Avaliador, AvaliacaoDissertacao, RankingItem } from '../types';
import { computeConsolidatedRanking } from '../utils/evaluationUtils';
import { EDITAL_INFO } from '../data/editalData';
import { CRITERIOS_AVALIACAO } from '../data/criteriosData';

interface ConsolidationViewProps {
  dissertacoes: Dissertacao[];
  avaliadores: Avaliador[];
  avaliacoes: Record<string, Record<string, AvaliacaoDissertacao>>;
  onAbrirAta: () => void;
  onAbrirAtaMockup: () => void;
  isPresidente: boolean;
  onExportarDados: () => void;
  onImportarDados: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRecarregarSupabase?: () => void;
  onLimparDados: () => void;
}

export const ConsolidationView: React.FC<ConsolidationViewProps> = ({
  dissertacoes,
  avaliadores,
  avaliacoes,
  onAbrirAta,
  onAbrirAtaMockup,
  isPresidente,
  onExportarDados,
  onImportarDados,
  onRecarregarSupabase,
  onLimparDados,
}) => {

  const [copiado, setCopiado] = useState(false);
  const [detalheDissertacaoId, setDetalheDissertacaoId] = useState<string | null>(null);

  const ranking = computeConsolidatedRanking(dissertacoes, avaliadores, avaliacoes);
  const presidente = avaliadores.find((a) => a.papel === 'presidente') || avaliadores[0];

  // Status de preenchimento dos avaliadores
  const statusAvaliadores = avaliadores.map((av) => {
    let concluidas = 0;
    dissertacoes.forEach((diss) => {
      if (avaliacoes[diss.id]?.[av.id]?.concluida) {
        concluidas += 1;
      }
    });
    return {
      avaliador: av,
      concluidas,
      percentual: (concluidas / dissertacoes.length) * 100,
    };
  });

  const primeiroLugar = ranking[0];
  const segundoLugar = ranking[1];

  const handleCopiarRelatorio = () => {
    let texto = `==========================================================\n`;
    texto += `UNIVERSIDADE VALE DO RIO DOCE - UNIVALE\n`;
    texto += `PROGRAMA DE PÓS-GRADUAÇÃO EM GESTÃO INTEGRADA DO TERRITÓRIO (PPG/GIT)\n`;
    texto += `RELATÓRIO CONSOLIDADO DA COMISSÃO DE AVALIAÇÃO\n`;
    texto += `PRÊMIO DE MELHOR DISSERTAÇÃO DO PPG/GIT DE 2025 (EDITAL 115/2026)\n`;
    texto += `Data de Emissão: ${new Date().toLocaleDateString('pt-BR')}\n`;
    texto += `Presidente da Comissão: ${presidente.nome} (${presidente.instituicao})\n`;
    texto += `Metodologia: Escala Likert (15 a 75 pts) + Nota Livre (0 a 25 pts) = Máx. 100 pts\n`;
    texto += `==========================================================\n\n`;

    texto += `RANKING FINAL HOMOLOGADO:\n\n`;
    ranking.forEach((item) => {
      texto += `${item.posicao}º LUGAR: ${item.dissertacao.autor.toUpperCase()} - Média Final: ${item.notaMediaFinal100.toFixed(2)} pts\n`;
      texto += `   [Likert Méd.: ${item.mediaLikert75.toFixed(1)}/75 pts | Nota Livre Méd.: ${item.mediaNotaLivre25.toFixed(1)}/25 pts | Escala Edital: ${item.notaMediaEscala5.toFixed(2)}/5.00]\n`;
      texto += `   Título: "${item.dissertacao.titulo}"\n`;
      texto += `   Laboratório: ${item.dissertacao.laboratorio}\n`;
      if (item.criterioDesempateAplicado) {
        texto += `   Desempate: ${item.criterioDesempateAplicado}\n`;
      }
      texto += `   Votos para Menção Honrosa: ${item.votosMencaoHonrosa} votos\n\n`;
    });

    texto += `DELIBERAÇÃO FINAL DA COMISSÃO:\n`;
    if (primeiroLugar) {
      texto += `- VENCEDOR DO PRÊMIO DE MELHOR DISSERTAÇÃO PPG/GIT 2025: ${primeiroLugar.dissertacao.autor} (${primeiroLugar.notaMediaFinal100.toFixed(2)} pts)\n`;
      texto += `  Direito à publicação de e-book junto à UNIVALE Editora (Art. 4.1.III).\n`;
    }
    if (segundoLugar) {
      texto += `- INDICAÇÃO DE MENÇÃO HONROSA (Art. 3.4 do Edital): ${segundoLugar.dissertacao.autor} (${segundoLugar.notaMediaFinal100.toFixed(2)} pts)\n\n`;
    }

    texto += `MEMBROS DA COMISSÃO AVALIADORA:\n`;
    avaliadores.forEach((av) => {
      texto += `- ${av.nome} (${av.instituicao}) - ${av.papel === 'presidente' ? 'Presidente' : 'Membro Avaliador'}\n`;
    });

    navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleEnviarEmail = () => {
    const assunto = encodeURIComponent(`Parecer e Ata da Comissão de Avaliação - Prêmio Melhor Dissertação PPG/GIT 2025`);
    const corpo = encodeURIComponent(
      `Prezada Coordenação do PPG/GIT - Univale,\n\n` +
      `Encaminhamos a conclusão dos trabalhos e pontuações consolidadas da Comissão de Avaliação do Prêmio de Melhor Dissertação do PPG/GIT de 2025 (Edital Nº 115/2026).\n\n` +
      `Fórmula aplicada: Escala Likert 15 afirmações (15 a 75 pts) + Nota Livre do Professor (0 a 25 pts) = Total até 100 pontos.\n\n` +
      `1º Lugar (Vencedora): ${primeiroLugar?.dissertacao.autor} (Média ${primeiroLugar?.notaMediaFinal100.toFixed(2)} pts)\n` +
      `2º Lugar (Menção Honrosa): ${segundoLugar?.dissertacao.autor} (Média ${segundoLugar?.notaMediaFinal100.toFixed(2)} pts)\n\n` +
      `Presidente da Comissão: ${presidente.nome} (${presidente.instituicao})\n\n` +
      `Atenciosamente,\n` +
      `Comissão de Avaliação`
    );
    window.location.href = `mailto:${EDITAL_INFO.emailContato}?subject=${assunto}&body=${corpo}`;
  };

  return (
    <div className="space-y-6">
      {/* Top Banner de Status da Comissão */}
      <div className="bg-white border border-stone-200 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span className="font-semibold text-stone-800">Comissão de Avaliação do PPG/GIT</span>
              <span aria-hidden="true">·</span>
              <span>Presidente: <strong>{presidente.nome}</strong></span>
              <span aria-hidden="true">·</span>
              <span>{avaliadores.length} Avaliadores Cadastrados (Ordem Alfabética)</span>
            </div>
            <h2 className="text-xl font-serif font-bold text-stone-900">
              Consolidação de Notas & Ata de Deliberação
            </h2>
            <p className="text-xs text-stone-600 mt-0.5">
              Cálculo integrado: <strong>Escala Likert (15 a 75 pts)</strong> + <strong>Nota Livre do Professor (0 a 25 pts)</strong> = <strong>Nota Final de até 100 pontos</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onAbrirAtaMockup}
              className="px-4 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ring-1 ring-amber-500/40"
              title="Abre a confecção da Ata Oficial formatada em PDF (exclusivo do Presidente)"
            >
              <Gavel className="w-3.5 h-3.5 text-amber-900" />
              <span>Confeccionar Ata Oficial (Presidente)</span>
            </button>

            <button
              onClick={onAbrirAta}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center gap-1.5 transition-colors"
              title="Visualizar resumo de deliberação"
            >
              <FileText className="w-3.5 h-3.5 text-stone-600" />
              <span>Resumo Deliberativo</span>
            </button>

            <button
              onClick={handleCopiarRelatorio}
              className="px-3 py-2 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiado ? 'Copiado!' : 'Copiar Parecer'}</span>
            </button>

            <button
              onClick={handleEnviarEmail}
              className="px-3 py-2 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-amber-700" />
              <span>Enviar para PPG/GIT</span>
            </button>
          </div>
        </div>

        {/* Informação sobre a Ata Oficial exclusiva do Presidente */}
        <div className="mt-4 p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Gavel className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-semibold text-amber-950">
              Ata Oficial em formato PDF (Padronização UNIVALE):
            </span>
            <span className="text-stone-600">
              Disponível para emissão e homologação digital pelo Presidente da Comissão ({presidente.nome}) com a credencial especial.
            </span>
          </div>
          <button
            onClick={onAbrirAtaMockup}
            className="px-2.5 py-1 text-xs font-bold text-amber-950 bg-amber-200 hover:bg-amber-300 border border-amber-400 rounded-md flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Abrir Mockup da Ata PDF</span>
          </button>
        </div>

        {/* Status de preenchimento dos avaliadores em ordem alfabética */}
        <div className="mt-5 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-2.5">
          {statusAvaliadores.map(({ avaliador, concluidas, percentual }) => (
            <div
              key={avaliador.id}
              className="bg-stone-50 border border-stone-200 rounded-lg p-2.5 text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-900 truncate pr-1">
                  {avaliador.nome}
                </span>
                {avaliador.papel === 'presidente' && (
                  <span title="Presidência da Comissão" className="text-amber-600 shrink-0 inline-flex items-center">
                    <Gavel className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1 text-stone-500">
                <span>{concluidas}/4 avaliadas</span>
                <span className="font-mono font-bold text-stone-800">
                  {percentual.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full ${concluidas === 4 ? 'bg-emerald-600' : 'bg-amber-500'}`}
                  style={{ width: `${percentual}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Destaque do 1º Lugar e Menção Honrosa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1º Lugar Vencedora */}
        <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/30 border-2 border-amber-400/80 rounded-xl p-5 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 text-amber-200/40 pointer-events-none">
            <Award className="w-36 h-36" />
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500 text-stone-950 font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5">
                <Award className="w-4 h-4" /> 1º Lugar · Vencedora do Prêmio PPG/GIT 2025
              </span>
            </div>

            {primeiroLugar && (
              <>
                <div>
                  <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug">
                    {primeiroLugar.dissertacao.autor}
                  </h3>
                  <p className="text-xs text-stone-700 italic mt-1 line-clamp-2">
                    "{primeiroLugar.dissertacao.titulo}"
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-200/70 text-xs">
                  <div>
                    <span className="text-stone-500 block">Likert (75):</span>
                    <span className="font-mono text-base font-bold text-stone-800">
                      {primeiroLugar.mediaLikert75.toFixed(1)} <span className="text-[10px] text-stone-400">/ 75</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block">Nota Livre (25):</span>
                    <span className="font-mono text-base font-bold text-amber-700">
                      +{primeiroLugar.mediaNotaLivre25.toFixed(1)} <span className="text-[10px] text-stone-400">/ 25</span>
                    </span>
                  </div>
                  <div>
                    <span className="text-stone-500 block font-semibold text-amber-900">Média Final:</span>
                    <span className="font-mono text-xl font-black text-amber-900">
                      {primeiroLugar.notaMediaFinal100.toFixed(2)}
                      <span className="text-[10px] font-normal text-stone-500"> / 100</span>
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-amber-900 bg-amber-100/70 p-2.5 rounded-lg border border-amber-300/80 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <span>
                    <strong>Outorga e Publicação (Edital Art. 4.1):</strong> Certificado de Melhor Dissertação e oportunidade editorial com a <strong>UNIVALE Editora</strong> para publicação em formato e-book.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* 2º Lugar - Menção Honrosa */}
        <div className="bg-stone-50 border border-stone-300 rounded-xl p-5 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="bg-stone-200 text-stone-800 font-bold text-xs uppercase tracking-wider px-2.5 py-1 rounded-md flex items-center gap-1.5">
              <Award className="w-4 h-4 text-stone-600" /> 2º Lugar · Candidata à Menção Honrosa
            </span>
          </div>

          {segundoLugar && (
            <>
              <div>
                <h3 className="text-lg font-serif font-bold text-stone-900 leading-snug">
                  {segundoLugar.dissertacao.autor}
                </h3>
                <p className="text-xs text-stone-700 italic mt-1 line-clamp-2">
                  "{segundoLugar.dissertacao.titulo}"
                </p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-200 text-xs">
                <div>
                  <span className="text-stone-500 block">Likert (75):</span>
                  <span className="font-mono text-base font-bold text-stone-800">
                    {segundoLugar.mediaLikert75.toFixed(1)} <span className="text-[10px] text-stone-400">/ 75</span>
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">Nota Livre (25):</span>
                  <span className="font-mono text-base font-bold text-stone-800">
                    +{segundoLugar.mediaNotaLivre25.toFixed(1)} <span className="text-[10px] text-stone-400">/ 25</span>
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block font-semibold text-stone-900">Média Final:</span>
                  <span className="font-mono text-xl font-bold text-stone-900">
                    {segundoLugar.notaMediaFinal100.toFixed(2)}
                    <span className="text-[10px] font-normal text-stone-500"> / 100</span>
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-stone-700 bg-white p-2.5 rounded-lg border border-stone-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Item 3.4 do Edital:</strong> "A comissão de avaliação poderá decidir pela atribuição, ou não, de uma menção honrosa ao segundo colocado da pontuação final." A comissão valida com {segundoLugar.votosMencaoHonrosa} votos favoráveis.
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Matriz Completa de Notas & Ranking Oficial */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Tabela Consolidada de Avaliações
            </h3>
            <p className="text-xs text-stone-500">
              Pontuações individuais dos membros externos (Likert 75 + Livre 25 = 100) e média final homologada
            </p>
          </div>
          <span className="text-xs font-semibold text-amber-900 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Escala: 15 a 75 (Likert) + 0 a 25 (Livre) = 0 a 100 pts
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-stone-100/75 border-b border-stone-200 text-stone-700 font-semibold text-xs">
              <tr>
                <th className="py-3 px-3 w-12 text-center">Class.</th>
                <th className="py-3 px-3 min-w-[240px]">Dissertação / Autor / PDF Anexo</th>
                {avaliadores.map((av) => (
                  <th key={av.id} className="py-3 px-2 text-center min-w-[90px]">
                    <div className="truncate font-semibold">{av.nome}</div>
                    <div className="text-[10px] font-normal text-stone-500">
                      {av.papel === 'presidente' ? '(Pres.)' : '(Membro)'}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 text-center min-w-[80px]">
                  Méd. Likert (75)
                </th>
                <th className="py-3 px-3 text-center min-w-[80px]">
                  Méd. Livre (25)
                </th>
                <th className="py-3 px-3 text-center font-mono font-bold bg-amber-50/60 text-amber-900 min-w-[100px]">
                  Média Final (100)
                </th>
                <th className="py-3 px-3 text-center min-w-[70px]">
                  Escala (0-5)
                </th>
                <th className="py-3 px-3 text-center min-w-[70px]">
                  Detalhes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/80">
              {ranking.map((item) => {
                const isWinner = item.posicao === 1;
                const isSecond = item.posicao === 2;

                return (
                  <React.Fragment key={item.dissertacao.id}>
                    <tr className={`hover:bg-stone-50/80 transition-colors ${
                      isWinner ? 'bg-amber-50/20' : ''
                    }`}>
                      <td className="py-3.5 px-3 text-center">
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full font-mono text-xs font-bold ${
                          isWinner
                            ? 'bg-amber-500 text-stone-950 shadow-sm'
                            : isSecond
                            ? 'bg-stone-300 text-stone-800'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {item.posicao}º
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-stone-900 leading-snug">
                          {item.dissertacao.autor}
                        </div>
                        <div className="text-xs text-stone-600 italic line-clamp-1 mt-0.5">
                          "{item.dissertacao.titulo}"
                        </div>
                        <div className="text-[11px] text-stone-400 mt-1 flex items-center gap-2">
                          <a
                            href={item.dissertacao.pdfLocalPath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-800 hover:text-amber-900 underline font-medium flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3 text-amber-700" />
                            <span>PDF Anexo</span>
                          </a>
                          <span aria-hidden="true">·</span>
                          <span>{item.dissertacao.laboratorio}</span>
                          {item.criterioDesempateAplicado && (
                            <span className="text-amber-800 font-semibold bg-amber-100/80 px-1.5 py-0.2 rounded text-[10px]">
                              {item.criterioDesempateAplicado}
                            </span>
                          )}
                        </div>
                      </td>

                      {avaliadores.map((av) => {
                        const avScore = item.avaliacoes[av.id];
                        return (
                          <td key={av.id} className="py-3.5 px-2 text-center">
                            {avScore && avScore.concluida ? (
                              <div>
                                <span className="font-mono font-bold text-stone-900 block">
                                  {avScore.notaFinal100.toFixed(1)}
                                </span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {avScore.somatorioLikert75}+{avScore.notaLivre25}
                                </span>
                              </div>
                            ) : (
                              <span className="text-stone-400 text-xs italic">—</span>
                            )}
                          </td>
                        );
                      })}

                      <td className="py-3.5 px-3 text-center font-mono text-stone-700">
                        {item.mediaLikert75.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-amber-700 font-medium">
                        +{item.mediaNotaLivre25.toFixed(1)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-extrabold text-base bg-amber-50/60 text-amber-900">
                        {item.notaMediaFinal100.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-xs font-semibold text-stone-700">
                        {item.notaMediaEscala5.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setDetalheDissertacaoId(
                            detalheDissertacaoId === item.dissertacao.id ? null : item.dissertacao.id
                          )}
                          className="text-xs text-amber-700 hover:text-amber-800 underline font-medium"
                        >
                          {detalheDissertacaoId === item.dissertacao.id ? 'Fechar' : 'Ver'}
                        </button>
                      </td>
                    </tr>

                    {/* Linha expandida com desdobramento dos 5 critérios */}
                    {detalheDissertacaoId === item.dissertacao.id && (
                      <tr className="bg-stone-50/70 border-y border-stone-200">
                        <td colSpan={7 + avaliadores.length} className="p-4">
                          <div className="bg-white rounded-lg p-4 border border-stone-200 space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-600">
                              Desdobramento das Médias por Critério (Item 5.1 do Edital - Escala 1 a 5)
                            </h4>

                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                              {CRITERIOS_AVALIACAO.map((c) => {
                                const mediaC = item.mediasPorCriterio[c.id] || 0;
                                return (
                                  <div key={c.id} className="bg-stone-50 p-2.5 rounded border border-stone-200 text-xs">
                                    <span className="text-[10px] text-stone-500 font-semibold block uppercase">
                                      Critério {c.numero}
                                    </span>
                                    <span className="font-semibold text-stone-800 text-xs line-clamp-1" title={c.nome}>
                                      {c.nome}
                                    </span>
                                    <div className="font-mono text-base font-bold text-amber-800 mt-1">
                                      {mediaC > 0 ? mediaC.toFixed(2) : '—'} <span className="text-[10px] font-normal text-stone-400">/ 5.0</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Pareceres dos avaliadores */}
                            <div className="pt-2 border-t border-stone-100 space-y-2">
                              <h5 className="text-xs font-semibold text-stone-700">
                                Pareceres Registrados pelos Avaliadores:
                              </h5>
                              <div className="space-y-2">
                                {avaliadores.map((av) => {
                                  const parecer = item.avaliacoes[av.id]?.comentariosGerais;
                                  if (!parecer) return null;
                                  return (
                                    <div key={av.id} className="text-xs bg-stone-50 p-2.5 rounded border border-stone-100">
                                      <span className="font-semibold text-stone-800">{av.nome}: </span>
                                      <span className="text-stone-600 italic">"{parecer}"</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regras de Desempate e Sigilo do Edital */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-xs text-stone-600 space-y-3">
        <h4 className="font-serif font-bold text-stone-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
          Disposições do Edital Nº 115/2026 aplicadas pelo sistema
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-stone-700">
          <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
            <span className="font-semibold text-stone-900 block">Art. 5.2.3.1 (Desempate 1):</span>
            <p>
              "Em caso de empate na classificação, terá preferência a dissertação cujo autor tenha concluído o curso em menor tempo, contado em dias entre a primeira matrícula como discente regular no PPG/GIT e a defesa."
            </p>
          </div>
          <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-1">
            <span className="font-semibold text-stone-900 block">Art. 5.2.3.2 (Desempate 2 - Critérios Sucessivos):</span>
            <p>
              "Persistindo o empate, são consideradas sucessivamente: 1) qualidade e rigor metodológico; 2) originalidade e contribuição; 3) relevância e impacto social; 4) fundamentação teórica; 5) qualidade de escrita."
            </p>
          </div>
        </div>
      </div>

      {/* Ações de Backup, Importação e Demonstração */}
      <div className="bg-white border border-stone-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-stone-800 block">
            Gestão de Dados & Intercâmbio entre os Docentes
          </span>
          <span className="text-xs text-stone-500">
            Exporte as notas para encaminhar ao Presidente ou importe a avaliação de outro membro da comissão.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onExportarDados}
            className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Dados (JSON)</span>
          </button>

          <label className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Importar JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={onImportarDados}
              className="hidden"
            />
          </label>

          {onRecarregarSupabase && (
            <button
              onClick={onRecarregarSupabase}
              className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Buscar avaliações mais recentes salvas no Supabase por todos os avaliadores"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700" />
              <span>Sincronizar Supabase</span>
            </button>
          )}

          <button
            onClick={onLimparDados}
            className="px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 border border-red-200 rounded-lg transition-colors cursor-pointer"
          >
            Limpar Avaliações
          </button>
        </div>
      </div>
    </div>
  );
};
