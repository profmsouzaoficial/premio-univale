import React, { useState } from 'react';
import { 
  Award, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  KeyRound, 
  Gavel,
  AlertCircle,
  Building,
  Mail,
  Loader2
} from 'lucide-react';
import { Avaliador } from '../types';
import { autenticarProfessorSupabase, LOGO_UNIVALE_URL } from '../services/supabaseClient';

interface LoginScreenProps {
  avaliadores: Avaliador[];
  onLoginSucesso: (avaliador: Avaliador, isPresidente: boolean) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  avaliadores,
  onLoginSucesso,
}) => {
  // Ordenação alfabética garantida
  const avaliadoresOrdenados = [...avaliadores].sort((a, b) => a.nome.localeCompare(b.nome));

  const [avaliadorId, setAvaliadorId] = useState<string>(avaliadoresOrdenados[0]?.id || '');
  const [senha, setSenha] = useState<string>('');
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState<boolean>(false);

  const professorSelecionado = avaliadoresOrdenados.find((a) => a.id === avaliadorId) || avaliadoresOrdenados[0];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (!professorSelecionado) {
      setErro('Por favor, selecione um professor da comissão.');
      return;
    }

    const senhaDigitada = senha.trim().toLowerCase();
    if (!senhaDigitada) {
      setErro('Por favor, digite a senha de acesso.');
      return;
    }

    setCarregando(true);

    // Validação da senha personalizada, compartilhada "premio" ou da credencial específica da presidência
    const isValida = 
      senha.trim() === professorSelecionado.senhaAcesso ||
      senhaDigitada === 'premio' || 
      senhaDigitada === (professorSelecionado.senhaAcesso || '').toLowerCase() ||
      (professorSelecionado.papel === 'presidente' && senhaDigitada === 'presidente');

    if (!isValida) {
      setCarregando(false);
      setErro(`Senha incorreta para ${professorSelecionado.nome}. Verifique a senha da comissão.`);
      return;
    }

    // Tenta autenticar na instância Supabase Auth (sem bloquear caso offline)
    try {
      await autenticarProfessorSupabase(professorSelecionado.email, senha.trim());
    } catch {
      // Ignora erro se Supabase auth estiver em modo anônimo
    }

    setCarregando(false);
    const isPres = professorSelecionado.papel === 'presidente';
    onLoginSucesso(professorSelecionado, isPres);
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden font-sans">
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950 to-stone-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Cabeçalho Institucional com Logotipo Oficial da UNIVALE */}
        <div className="text-center space-y-2">
          <div className="h-14 px-3 py-1.5 mx-auto rounded-2xl bg-white border border-stone-700/80 inline-flex items-center justify-center shadow-lg mb-2">
            <img
              src={LOGO_UNIVALE_URL}
              alt="Logotipo Oficial UNIVALE"
              className="h-10 w-auto object-contain max-w-[150px]"
            />
          </div>
          <div className="block">
            <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
              PPG/GIT · Gestão Integrada do Território
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
            Prêmio de Melhor Dissertação 2025
          </h1>
          <p className="text-xs text-stone-400">

            Comissão de Avaliação · Edital UNIVALE Nº 115/2026
          </p>
        </div>

        {/* Formulário de Identificação e Senha */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Selecione o Professor Avaliador:</span>
            </label>
            <select
              value={avaliadorId}
              onChange={(e) => {
                setAvaliadorId(e.target.value);
                setErro(null);
              }}
              className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 font-medium cursor-pointer"
            >
              {avaliadoresOrdenados.map((av) => (
                <option key={av.id} value={av.id}>
                  {av.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Cartão de Detalhes do Professor Selecionado */}
          {professorSelecionado && (
            <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-stone-200">{professorSelecionado.nome}</span>
                {professorSelecionado.papel === 'presidente' ? (
                  <span
                    title="Presidência da Comissão"
                    className="p-1 text-amber-400 hover:text-amber-300 inline-flex items-center"
                  >
                    <Gavel className="w-3.5 h-3.5" />
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-stone-800 text-stone-400 font-medium text-[10px]">
                    Membro Avaliador
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 text-stone-400 text-[11px]">
                <Mail className="w-3 h-3 text-stone-500 shrink-0" />
                <span className="truncate">{professorSelecionado.email}</span>
              </div>
              <div className="flex items-center gap-1.5 text-stone-500 text-[11px]">
                <Building className="w-3 h-3 shrink-0" />
                <span className="truncate">{professorSelecionado.instituicao}</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Senha de Acesso:</span>
            </label>
            <div className="relative">
              <input
                type="password"
                value={senha}
                onChange={(e) => {
                  setSenha(e.target.value);
                  setErro(null);
                }}
                placeholder="Digite sua senha de acesso..."
                className="w-full pl-3.5 pr-10 py-2.5 bg-stone-950 border border-stone-700 rounded-xl text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"
                autoFocus
              />
              <Lock className="w-4 h-4 text-stone-500 absolute right-3.5 top-3" />
            </div>
          </div>

          {erro && (
            <div className="text-xs text-red-400 bg-red-950/50 border border-red-800/60 p-2.5 rounded-lg flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{erro}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-stone-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99] cursor-pointer"
          >
            {carregando ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <span>Entrar no Sistema</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-800/60">
          <span className="text-[11px] text-stone-500 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
            <span>Sigilo e preservação da comissão de avaliação · UNIVALE</span>
          </span>
        </div>
      </div>
    </div>
  );
};
