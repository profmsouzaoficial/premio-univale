import React, { useState } from 'react';
import { Lock, ShieldCheck, ArrowRight, AlertCircle, Award } from 'lucide-react';

interface PasswordGateProps {
  onAutenticar: () => void;
}

export const PasswordGate: React.FC<PasswordGateProps> = ({ onAutenticar }) => {
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (senha.trim().toLowerCase() === 'premio') {
      onAutenticar();
    } else {
      setErro(true);
      setTimeout(() => setErro(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative subtle background elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-stone-950 to-stone-950 pointer-events-none" />

      <div className="relative z-10 w-full max-w-md bg-stone-900 border border-stone-800 rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {/* Branding */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner mb-4">
            <Award className="w-8 h-8" />
          </div>
          <span className="text-xs font-mono font-bold tracking-widest text-amber-400 uppercase">
            UNIVALE · PPG/GIT
          </span>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-stone-100">
            Prêmio de Melhor Dissertação 2025
          </h1>
          <p className="text-xs text-stone-400">
            Ambiente Restrito & Sigiloso da Comissão de Avaliação (Edital Nº 115/2026)
          </p>
        </div>

        {/* Security Alert Note */}
        <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-3.5 text-xs text-stone-400 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Para assegurar o sigilo estipulado pelo Edital e pela Coordenação do Programa, insira a senha oficial de acesso à comissão.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              Senha de Acesso
            </label>
            <input
              type="password"
              autoFocus
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Digite a senha..."
              className={`w-full px-3.5 py-2.5 bg-stone-950 border rounded-xl text-stone-100 placeholder:text-stone-600 text-sm focus:outline-none transition-all ${
                erro
                  ? 'border-red-500 ring-2 ring-red-500/30'
                  : 'border-stone-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400'
              }`}
            />
          </div>

          {erro && (
            <div className="text-xs text-red-400 bg-red-950/50 border border-red-800/60 p-2.5 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Senha incorreta. Dica: verifique a comunicação da comissão.</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md active:scale-[0.99]"
          >
            <span>Acessar Painel da Comissão</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-stone-800/80">
          <span className="text-[11px] text-stone-500">
            Universidade Vale do Rio Doce · Governador Valadares/MG
          </span>
        </div>
      </div>
    </div>
  );
};
