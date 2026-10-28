import React, { useState } from 'react';
import { X, Users, ShieldAlert, Check, Phone, Mail, Building, Gavel } from 'lucide-react';
import { Avaliador } from '../types';

interface CommissionModalProps {
  aberto: boolean;
  onFechar: () => void;
  avaliadores: Avaliador[];
  onSalvarAvaliadores: (novosAvaliadores: Avaliador[]) => void;
}

export const CommissionModal: React.FC<CommissionModalProps> = ({
  aberto,
  onFechar,
  avaliadores,
  onSalvarAvaliadores,
}) => {
  if (!aberto) return null;

  const [membros, setMembros] = useState<Avaliador[]>(avaliadores);
  const [salvo, setSalvo] = useState(false);

  const handleMudarCampo = (index: number, campo: keyof Avaliador, valor: string) => {
    const atualizados = [...membros];
    atualizados[index] = { ...atualizados[index], [campo]: valor };
    setMembros(atualizados);
  };

  const handleDefinirPresidente = (idSelecionado: string) => {
    const atualizados = membros.map((m) => ({
      ...m,
      papel: (m.id === idSelecionado ? 'presidente' : 'avaliador') as 'presidente' | 'avaliador',
    }));
    setMembros(atualizados);
  };

  const handleSalvar = () => {
    onSalvarAvaliadores(membros);
    setSalvo(true);
    setTimeout(() => {
      setSalvo(false);
      onFechar();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-base">
                Composição da Comissão de Avaliação (GIT 2025)
              </h3>
              <p className="text-xs text-stone-400">
                Avaliadores cadastrados em ordem alfabética e atribuição da Presidência da Comissão
              </p>
            </div>
          </div>
          <button
            onClick={onFechar}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Instrução do e-mail oficial */}
          <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs text-stone-700 flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-stone-900">
                Orientação da Coordenação do PPG/GIT aos Avaliadores:
              </p>
              <p className="text-xs text-stone-600 leading-relaxed italic">
                "Como primeiro passo, sugiro uma primeira conversa entre vocês para atribuir quem será o Presidente da Comissão de Avaliação do Prêmio de Melhor Dissertação do GIT 2025. Pode ser o caso de trocar telefones/whatsapps, contem comigo nesta etapa. Nas demais, é importante o sigilo da Comissão."
              </p>
            </div>
          </div>

          {/* Cards dos 3 membros */}
          <div className="space-y-4">
            {membros.map((membro, index) => {
              const isPresidente = membro.papel === 'presidente';

              return (
                <div
                  key={membro.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isPresidente
                      ? 'border-amber-400 bg-amber-50/30 ring-1 ring-amber-400'
                      : 'border-stone-200 bg-stone-50'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-200/70">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-stone-500">
                        Membro {index + 1}
                      </span>
                      {isPresidente && (
                        <span
                          title="Presidência da Comissão"
                          className="text-amber-600 inline-flex items-center"
                        >
                          <Gavel className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDefinirPresidente(membro.id)}
                      className={`text-xs px-3 py-1 rounded-md font-medium transition-colors ${
                        isPresidente
                          ? 'bg-amber-100 text-amber-900 cursor-default'
                          : 'bg-white hover:bg-stone-200 text-stone-700 border border-stone-300'
                      }`}
                    >
                      {isPresidente ? '✓ Atualmente Presidente' : 'Designar como Presidente'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Nome Completo e Titulação
                      </label>
                      <input
                        type="text"
                        value={membro.nome}
                        onChange={(e) => handleMudarCampo(index, 'nome', e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1">
                        Instituição de Ensino Superior (IES Externa)
                      </label>
                      <input
                        type="text"
                        value={membro.instituicao}
                        onChange={(e) => handleMudarCampo(index, 'instituicao', e.target.value)}
                        placeholder="Ex: UFMG, UFV, PUC Minas..."
                        className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-stone-500" /> E-mail Institucional
                      </label>
                      <input
                        type="email"
                        value={membro.email || ''}
                        onChange={(e) => handleMudarCampo(index, 'email', e.target.value)}
                        className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                        <Phone className="w-3 h-3 text-stone-500" /> Telefone / WhatsApp para contato
                      </label>
                      <input
                        type="tel"
                        value={membro.telefone || ''}
                        onChange={(e) => handleMudarCampo(index, 'telefone', e.target.value)}
                        placeholder="(DDD) 99999-9999"
                        className="w-full text-xs p-2.5 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-stone-500">
            Alterações são salvas localmente no navegador.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onFechar}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              className="px-5 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow"
            >
              <Check className="w-4 h-4" />
              <span>{salvo ? 'Salvo!' : 'Salvar Alterações'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
