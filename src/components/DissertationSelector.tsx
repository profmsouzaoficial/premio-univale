import React from 'react';
import { ExternalLink, Check, AlertCircle, FileText } from 'lucide-react';
import { Dissertacao, AvaliacaoDissertacao } from '../types';

interface DissertationSelectorProps {
  dissertacoes: Dissertacao[];
  dissertacaoSelecionadaId: string;
  onSelecionar: (id: string) => void;
  avaliacoesDoAvaliador: Record<string, AvaliacaoDissertacao>;
}

export const DissertationSelector: React.FC<DissertationSelectorProps> = ({
  dissertacoes,
  dissertacaoSelecionadaId,
  onSelecionar,
  avaliacoesDoAvaliador,
}) => {
  return (
    <div className="bg-white border border-stone-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-stone-100">
        <div>
          <h2 className="text-sm font-serif font-bold text-stone-900">
            Dissertações Indicadas pelos Laboratórios do PPG/GIT (2025)
          </h2>
          <p className="text-xs text-stone-500">
            Selecione uma dissertação para preencher a escala Likert (15 a 75 pts) e a nota livre (0 a 25 pts).
          </p>
        </div>
        <span className="text-xs font-mono text-stone-400">
          4 Candidatas Homologadas · PDFs Integrados
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 pt-3">
        {dissertacoes.map((diss, index) => {
          const isSelected = diss.id === dissertacaoSelecionadaId;
          const avaliacao = avaliacoesDoAvaliador[diss.id];
          const isConcluida = avaliacao?.concluida;
          const nota = avaliacao?.notaFinal100;

          return (
            <div
              key={diss.id}
              onClick={() => onSelecionar(diss.id)}
              className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between gap-3 relative ${
                isSelected
                  ? 'border-amber-500 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-sm'
                  : 'border-stone-200/90 bg-stone-50/50 hover:bg-white hover:border-stone-300'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1 text-[11px]">
                  <span className="font-mono font-semibold text-stone-500">
                    Nº 0{index + 1}
                  </span>
                  {isConcluida ? (
                    <span className="flex items-center gap-1 font-semibold text-emerald-700 text-xs">
                      <Check className="w-3.5 h-3.5" /> Avaliada
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-stone-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 text-stone-400" /> Pendente
                    </span>
                  )}
                </div>

                <h3 className="text-xs font-semibold text-stone-900 line-clamp-2 leading-snug">
                  {diss.autor}
                </h3>

                <p className="text-[11px] text-stone-600 line-clamp-2 italic leading-tight">
                  "{diss.titulo}"
                </p>

                <p className="text-[10px] text-stone-400 line-clamp-1">
                  {diss.laboratorio}
                </p>
              </div>

              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between">
                <div>
                  {isConcluida && nota !== undefined ? (
                    <span className="font-mono text-xs font-bold text-amber-800">
                      Total: {nota.toFixed(1)} <span className="text-[10px] text-stone-500 font-normal">pts</span>
                    </span>
                  ) : (
                    <span className="text-[11px] text-stone-400 font-mono">Pendente de Avaliação</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <a
                    href={diss.pdfLocalPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Baixar/Visualizar PDF Anexo"
                    className="p-1 text-amber-700 hover:text-amber-800 hover:bg-amber-100/60 rounded transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </a>

                  <a
                    href={diss.linkAcesso}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title="Abrir no Repositório Univale"
                    className="p-1 text-stone-400 hover:text-amber-700 rounded transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
