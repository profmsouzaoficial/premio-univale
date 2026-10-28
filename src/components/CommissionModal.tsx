import React, { useState, useEffect } from 'react';
import { 
  X, 
  Users, 
  ShieldAlert, 
  Check, 
  Phone, 
  Mail, 
  Building, 
  Gavel, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Loader2, 
  AlertCircle,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { Avaliador } from '../types';

interface CommissionModalProps {
  aberto: boolean;
  onFechar: () => void;
  avaliadores: Avaliador[];
  avaliadorLogado: Avaliador;
  isPresidente: boolean;
  onSalvarAvaliadores: (novosAvaliadores: Avaliador[]) => Promise<void> | void;
  onAtualizarSenha?: (avaliadorId: string, email: string, novaSenha: string) => Promise<{ success: boolean; error?: string }>;
}

export const CommissionModal: React.FC<CommissionModalProps> = ({
  aberto,
  onFechar,
  avaliadores,
  avaliadorLogado,
  isPresidente,
  onSalvarAvaliadores,
  onAtualizarSenha,
}) => {
  if (!aberto) return null;

  const [membros, setMembros] = useState<Avaliador[]>(avaliadores);
  const [salvandoGeral, setSalvandoGeral] = useState(false);
  const [salvo, setSalvo] = useState(false);

  // Estados para alteração de senha do usuário logado
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [senhaMensagemSucesso, setSenhaMensagemSucesso] = useState<string | null>(null);
  const [senhaMensagemErro, setSenhaMensagemErro] = useState<string | null>(null);

  // Sincroniza membros quando as props mudarem
  useEffect(() => {
    setMembros(avaliadores);
  }, [avaliadores]);

  const handleMudarCampo = (index: number, campo: keyof Avaliador, valor: string) => {
    const atualizados = [...membros];
    atualizados[index] = { ...atualizados[index], [campo]: valor };
    setMembros(atualizados);
  };

  const handleDefinirPresidente = (idSelecionado: string) => {
    if (!isPresidente) return;
    const atualizados = membros.map((m) => ({
      ...m,
      papel: (m.id === idSelecionado ? 'presidente' : 'avaliador') as 'presidente' | 'avaliador',
    }));
    setMembros(atualizados);
  };

  const handleSalvarGeral = async () => {
    setSalvandoGeral(true);
    try {
      await onSalvarAvaliadores(membros);
      setSalvo(true);
      setTimeout(() => {
        setSalvo(false);
        onFechar();
      }, 1000);
    } finally {
      setSalvandoGeral(false);
    }
  };

  const handleSalvarNovaSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setSenhaMensagemErro(null);
    setSenhaMensagemSucesso(null);

    const limpa = novaSenha.trim();
    if (!limpa) {
      setSenhaMensagemErro('Por favor, informe uma nova senha.');
      return;
    }
    if (limpa.length < 4) {
      setSenhaMensagemErro('A nova senha deve possuir pelo menos 4 caracteres.');
      return;
    }
    if (limpa !== confirmarSenha.trim()) {
      setSenhaMensagemErro('As senhas digitadas não coincidem. Digite-as novamente.');
      return;
    }

    setSalvandoSenha(true);
    try {
      if (onAtualizarSenha) {
        const res = await onAtualizarSenha(avaliadorLogado.id, avaliadorLogado.email, limpa);
        if (!res.success) {
          setSenhaMensagemErro(res.error || 'Erro ao sincronizar senha com o Supabase.');
          return;
        }
      }

      // Atualiza também no array de membros local
      const atualizados = membros.map((m) =>
        m.id === avaliadorLogado.id ? { ...m, senhaAcesso: limpa } : m
      );
      setMembros(atualizados);
      await onSalvarAvaliadores(atualizados);

      setSenhaMensagemSucesso('Sua senha foi alterada com sucesso!');
      setNovaSenha('');
      setConfirmarSenha('');
      setTimeout(() => {
        setSenhaMensagemSucesso(null);
      }, 4000);
    } catch (err) {
      setSenhaMensagemErro('Ocorreu um erro ao atualizar a senha.');
    } finally {
      setSalvandoSenha(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white border border-stone-200 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Header institucional */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-stone-800 border border-stone-700 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif font-bold text-sm sm:text-base text-stone-100">
                  Composição da Comissão de Avaliação (GIT 2025)
                </h3>
              </div>
              <p className="text-xs text-stone-400">
                Avaliadores cadastrados em ordem alfabética e governança da Comissão
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            title="Fechar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content com controle de permissões */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-stone-800">
          
          {/* Banner de Permissões */}
          {isPresidente ? (
            <div className="bg-amber-500/10 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 flex items-start gap-3">
              <Gavel className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">
                  Acesso da Presidência da Comissão ({avaliadorLogado?.nome})
                </p>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  Como Presidente, você possui autorização regimental para editar as informações cadastrais de todos os membros e transferir ou designar a Presidência para outro membro da comissão.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-stone-100 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-700 flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-stone-900">
                  Avaliador Conectado: {avaliadorLogado?.titulacao} {avaliadorLogado?.nome}
                </p>
                <p className="text-stone-600 mt-0.5 leading-relaxed">
                  Você pode editar livremente os seus próprios dados cadastrais e redefinir sua senha de acesso. As informações dos demais colegas de comissão e a titularidade da Presidência permanecem em modo somente leitura.
                </p>
              </div>
            </div>
          )}

          {/* Orientação oficial da Coordenação do PPG/GIT */}
          <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 text-xs text-stone-600 flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold text-stone-800">
                Diretriz da Coordenação do PPG/GIT aos Avaliadores:
              </span>
              <p className="italic text-stone-600 leading-relaxed text-[11px]">
                "Como primeiro passo, sugiro uma primeira conversa entre vocês para atribuir quem será o Presidente da Comissão de Avaliação do Prêmio de Melhor Dissertação do GIT 2025. Nas demais etapas, é importante preservar o sigilo das deliberações individuais."
              </p>
            </div>
          </div>

          {/* Cards dos 6 membros */}
          <div className="space-y-4">
            {membros.map((membro, index) => {
              const isPresidenteDoMembro = membro.papel === 'presidente';
              const isProprioMembro = membro.id === avaliadorLogado?.id;
              // Apenas o próprio usuário logado ou o Presidente podem editar este card
              const podeEditar = isPresidente || isProprioMembro;

              return (
                <div
                  key={membro.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isProprioMembro
                      ? 'border-amber-400 bg-amber-50/20 shadow-xs ring-1 ring-amber-300'
                      : isPresidenteDoMembro
                      ? 'border-stone-300 bg-stone-50'
                      : 'border-stone-200 bg-stone-50/60'
                  }`}
                >
                  {/* Cabeçalho do Card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-stone-200">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-stone-500">
                        Membro {index + 1}
                      </span>
                      
                      {isProprioMembro && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Seu Perfil
                        </span>
                      )}

                      {isPresidenteDoMembro && (
                        <span
                          title="Presidência da Comissão"
                          className="text-amber-600 inline-flex items-center gap-1 text-xs font-semibold bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300/80"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                          <span>Presidência</span>
                        </span>
                      )}

                      {!podeEditar && (
                        <span className="text-[11px] text-stone-400 italic">
                          (Somente Leitura)
                        </span>
                      )}
                    </div>

                    {/* Botão de designação de presidência */}
                    <div>
                      {isPresidente ? (
                        <button
                          type="button"
                          onClick={() => handleDefinirPresidente(membro.id)}
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
                            isPresidenteDoMembro
                              ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300 cursor-default'
                              : 'bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 shadow-xs'
                          }`}
                        >
                          {isPresidenteDoMembro ? '✓ Atualmente Presidente' : 'Designar como Presidente'}
                        </button>
                      ) : (
                        <div className="text-xs text-stone-500">
                          {isPresidenteDoMembro ? (
                            <span className="font-semibold text-amber-700 flex items-center gap-1">
                              <Gavel className="w-3 h-3" /> Presidente da Comissão
                            </span>
                          ) : (
                            <span className="text-stone-400 text-[11px]">Avaliador Membro</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Formulário de dados cadastrais */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        value={membro.nome}
                        disabled={!podeEditar}
                        onChange={(e) => handleMudarCampo(index, 'nome', e.target.value)}
                        className={`w-full text-xs p-2.5 rounded-lg border font-medium ${
                          podeEditar
                            ? 'bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500'
                            : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Titulação Acadêmica
                      </label>
                      <input
                        type="text"
                        value={membro.titulacao}
                        disabled={!podeEditar}
                        onChange={(e) => handleMudarCampo(index, 'titulacao', e.target.value)}
                        placeholder="Ex: Dr., Dra., PhD"
                        className={`w-full text-xs p-2.5 rounded-lg border ${
                          podeEditar
                            ? 'bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500'
                            : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Building className="w-3 h-3 text-stone-500" /> Instituição de Ensino Superior (IES)
                      </label>
                      <input
                        type="text"
                        value={membro.instituicao}
                        disabled={!podeEditar}
                        onChange={(e) => handleMudarCampo(index, 'instituicao', e.target.value)}
                        placeholder="Ex: Universidade Federal de Juiz de Fora (UFJF)..."
                        className={`w-full text-xs p-2.5 rounded-lg border ${
                          podeEditar
                            ? 'bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500'
                            : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-500" /> E-mail Institucional
                      </label>
                      <input
                        type="email"
                        value={membro.email || ''}
                        disabled={!podeEditar}
                        onChange={(e) => handleMudarCampo(index, 'email', e.target.value)}
                        className={`w-full text-xs p-2.5 rounded-lg border ${
                          podeEditar
                            ? 'bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500'
                            : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-500" /> Telefone / WhatsApp para contato
                      </label>
                      <input
                        type="tel"
                        value={membro.telefone || ''}
                        disabled={!podeEditar}
                        onChange={(e) => handleMudarCampo(index, 'telefone', e.target.value)}
                        placeholder="(DDD) 99999-9999"
                        className={`w-full text-xs p-2.5 rounded-lg border ${
                          podeEditar
                            ? 'bg-white border-stone-300 text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-500'
                            : 'bg-stone-100 border-stone-200 text-stone-600 cursor-not-allowed'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Seção exclusiva de Alteração de Senha para o próprio usuário logado */}
                  {isProprioMembro && (
                    <div className="mt-4 pt-3.5 border-t border-amber-200 bg-white/80 p-3.5 rounded-xl border border-stone-200">
                      <div className="flex items-center gap-2 mb-2">
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-stone-900">
                          Alterar Minha Senha de Acesso
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-500 mb-3">
                        Defina uma senha pessoal para acessar sua conta nos próximos logins.
                      </p>

                      <form onSubmit={handleSalvarNovaSenha} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Nova Senha
                            </label>
                            <div className="relative">
                              <input
                                type={mostrarSenha ? 'text' : 'password'}
                                value={novaSenha}
                                onChange={(e) => setNovaSenha(e.target.value)}
                                placeholder="Mínimo 4 caracteres"
                                className="w-full text-xs p-2 pr-8 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => setMostrarSenha(!mostrarSenha)}
                                className="absolute right-2 top-2.5 text-stone-400 hover:text-stone-600"
                              >
                                {mostrarSenha ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                              Confirmar Nova Senha
                            </label>
                            <input
                              type={mostrarSenha ? 'text' : 'password'}
                              value={confirmarSenha}
                              onChange={(e) => setConfirmarSenha(e.target.value)}
                              placeholder="Repita a nova senha"
                              className="w-full text-xs p-2 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                            />
                          </div>
                        </div>

                        {senhaMensagemErro && (
                          <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            <span>{senhaMensagemErro}</span>
                          </div>
                        )}

                        {senhaMensagemSucesso && (
                          <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 p-2 rounded-lg border border-emerald-200">
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>{senhaMensagemSucesso}</span>
                          </div>
                        )}

                        <div className="flex justify-end pt-1">
                          <button
                            type="submit"
                            disabled={salvandoSenha || !novaSenha}
                            className="px-3.5 py-1.5 text-xs font-semibold text-stone-900 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                          >
                            {salvandoSenha ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Atualizando Senha...</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3.5 h-3.5" />
                                <span>Confirmar Mudança de Senha</span>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer com botão de salvar */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-b-2xl">
          <span className="text-xs text-stone-500">
            {isPresidente
              ? 'Alterações são salvas no banco de dados e sincronizadas com o Supabase.'
              : 'Seus dados e senha são salvos no banco de dados do Supabase.'}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={onFechar}
              disabled={salvandoGeral}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvarGeral}
              disabled={salvandoGeral}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
            >
              {salvandoGeral ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Salvando no Supabase...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{salvo ? 'Salvo no Supabase!' : 'Salvar Alterações'}</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
