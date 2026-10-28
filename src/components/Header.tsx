import React from 'react';
import { Award, BookOpen, Users, FileText, CheckCircle2, ShieldAlert, LogOut, Gavel, Lock } from 'lucide-react';
import { Avaliador } from '../types';
import { TROFEU_IMAGE_URL } from '../services/supabaseClient';

interface HeaderProps {
  abaAtiva: 'avaliacao' | 'consolidacao' | 'edital';
  setAbaAtiva: (aba: 'avaliacao' | 'consolidacao' | 'edital') => void;
  avaliadores: Avaliador[];
  avaliadorAtivo: Avaliador;
  onTrocarAvaliador: (id: string) => void;
  abrirModalComissao: () => void;
  abrirModalEdital: () => void;
  abrirModalAtaMockup: () => void;
  totalConcluidas: number;
  onLogout: () => void;
  isPresidente: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  abaAtiva,
  setAbaAtiva,
  avaliadores,
  avaliadorAtivo,
  onTrocarAvaliador,
  abrirModalComissao,
  abrirModalEdital,
  abrirModalAtaMockup,
  totalConcluidas,
  onLogout,
  isPresidente,
}) => {
  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-40 shadow-md">
      {/* Top institutional strip */}
      <div className="bg-stone-950 px-4 sm:px-6 py-1.5 border-b border-stone-800 text-xs text-stone-400 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wider text-amber-400 uppercase">UNIVALE</span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>PPG/GIT · Gestão Integrada do Território</span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span className="hidden sm:inline">Edital UNIVALE Nº 115/2026</span>
        </div>
        <div className="flex items-center gap-3 text-stone-400">
          <span className="flex items-center gap-1 text-amber-300/90 font-medium">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Sigilo Individual da Comissão
          </span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <span>Prazo: 19/Nov/2026</span>
          <span aria-hidden="true" className="text-stone-600">·</span>
          <button
            onClick={onLogout}
            title="Encerrar sessão deste avaliador"
            className="text-stone-400 hover:text-red-400 flex items-center gap-1 transition-colors cursor-pointer"
          >
            <LogOut className="w-3 h-3 text-red-400" />
            <span>Sair</span>
          </button>
        </div>
      </div>

      {/* Main branding & navigation bar with large trophy image & degradê overlay */}
      <div className="relative overflow-hidden bg-stone-900">
        {/* Imagem do troféu inteira e grande à esquerda com degradê suave */}
        <div className="absolute inset-y-0 left-0 w-80 sm:w-[110px] md:w-[150px] pointer-events-none select-none z-0 overflow-hidden">
          <img
            src={TROFEU_IMAGE_URL}
            alt="Troféu do Prêmio PPG/GIT"
            className="h-full w-full object-cover object-left"
          />
          {/* Degradê horizontal que preserva o troféu à esquerda e faz fusão suave na área do título */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-stone-900/65 to-stone-900" />
          <div className="absolute inset-0 bg-gradient-to-t from-stone-900/40 via-transparent to-stone-900/20" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Div do título posicionada por cima da imagem na parte em degradê */}
          <div className="flex flex-col justify-center pl-16 sm:pl-24 md:pl-28 max-w-xl">
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-50 tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
              Prêmio de Melhor Dissertação PPG/GIT 2025
            </h1>
            <p className="text-xs sm:text-sm text-stone-300 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] mt-0.5">
              Escala Likert (15 a 75 pts) + Nota Livre (0 a 25 pts) = Máx. 100 pontos
            </p>
          </div>

        {/* Avaliador Logado & Controles de Acesso */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-2 bg-stone-800/90 border border-stone-700 rounded-lg py-1.5 px-3 text-xs shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Sessão Ativa" />
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold text-stone-100">
                <span>{avaliadorAtivo.titulacao} {avaliadorAtivo.nome}</span>
                {isPresidente && (
                  <span
                    title="Presidência da Comissão"
                    className="text-amber-400 hover:text-amber-300 inline-flex items-center ml-0.5"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
              <span className="text-[10px] text-stone-400 truncate max-w-[190px]">
                {avaliadorAtivo.instituicao.split('/')[0].trim()}
              </span>
            </div>

            <button
              onClick={abrirModalComissao}
              title="Ver membros da Comissão de Avaliação"
              className="p-1.5 text-stone-400 hover:text-amber-400 rounded hover:bg-stone-700/50 transition-colors ml-1 cursor-pointer"
            >
              <Users className="w-4 h-4" />
            </button>

            <button
              onClick={onLogout}
              title="Trocar de professor / Encerrar sessão"
              className="p-1.5 text-stone-400 hover:text-red-400 rounded hover:bg-red-950/30 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Ata Oficial visível prioritariamente para o Presidente */}
          {isPresidente && (
            <button
              onClick={abrirModalAtaMockup}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm cursor-pointer"
              title="Visualizar documento PDF formatado da Ata da Presidência"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Ata Oficial (PDF)</span>
            </button>
          )}

          <button
            onClick={abrirModalEdital}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-300 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg transition-colors cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>Consultar Edital</span>
          </button>
        </div>
      </div>
    </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-1 border-t border-stone-800/60 overflow-x-auto">
        <button
          onClick={() => setAbaAtiva('avaliacao')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            abaAtiva === 'avaliacao'
              ? 'border-amber-400 text-amber-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Minhas Avaliações Individuais</span>
          <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-300 font-mono">
            {totalConcluidas}/4 Concluídas
          </span>
        </button>

        {/* Aba de Consolidação: Visível para o Presidente com todas as notas */}
        {isPresidente ? (
          <button
            onClick={() => setAbaAtiva('consolidacao')}
            className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
              abaAtiva === 'consolidacao'
                ? 'border-amber-400 text-amber-400 font-semibold'
                : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Consolidação da Comissão & Ata (Presidência)</span>
            {totalConcluidas === 4 && (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </button>
        ) : (
          <div
            title="O sigilo da comissão restringe a visualização do ranking global apenas ao Presidente da Comissão."
            className="flex items-center gap-1.5 py-3 px-4 text-xs text-stone-500 cursor-not-allowed select-none opacity-70"
          >
            <Lock className="w-3.5 h-3.5 text-stone-500" />
            <span>Consolidação Geral (Sigilo Preservado)</span>
          </div>
        )}

        <button
          onClick={() => setAbaAtiva('edital')}
          className={`flex items-center gap-2 py-3 px-4 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            abaAtiva === 'edital'
              ? 'border-amber-400 text-amber-400 font-semibold'
              : 'border-transparent text-stone-400 hover:text-stone-200 hover:border-stone-700'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Edital 115/2026 & Diretrizes</span>
        </button>
      </div>
    </header>
  );
};

