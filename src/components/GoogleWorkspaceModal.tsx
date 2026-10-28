import React, { useState } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  FileText, 
  ExternalLink, 
  Check, 
  AlertCircle, 
  Loader2, 
  LogOut, 
  ShieldCheck,
  CloudCheck
} from 'lucide-react';
import { User } from 'firebase/auth';
import { Dissertacao, Avaliador, AvaliacaoDissertacao } from '../types';
import { exportToGoogleSheets, SheetsExportResult } from '../services/googleSheetsService';
import { generateAtaGoogleDoc, DocsExportResult } from '../services/googleDocsService';
import { googleSignIn, logoutGoogle } from '../services/googleAuth';

interface GoogleWorkspaceModalProps {
  aberto: boolean;
  onFechar: () => void;
  usuario: User | null;
  token: string | null;
  onLoginSucesso: (user: User, token: string) => void;
  onLogoutSucesso: () => void;
  dissertacoes: Dissertacao[];
  avaliadores: Avaliador[];
  avaliacoes: Record<string, Record<string, AvaliacaoDissertacao>>;
  planilhaSalva: SheetsExportResult | null;
  setPlanilhaSalva: (res: SheetsExportResult | null) => void;
  docSalvo: DocsExportResult | null;
  setDocSalvo: (res: DocsExportResult | null) => void;
}

export const GoogleWorkspaceModal: React.FC<GoogleWorkspaceModalProps> = ({
  aberto,
  onFechar,
  usuario,
  token,
  onLoginSucesso,
  onLogoutSucesso,
  dissertacoes,
  avaliadores,
  avaliacoes,
  planilhaSalva,
  setPlanilhaSalva,
  docSalvo,
  setDocSalvo,
}) => {
  const [carregando, setCarregando] = useState<boolean>(false);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  if (!aberto) return null;

  const handleConectarGoogle = async () => {
    setCarregando(true);
    setMensagemErro(null);
    try {
      const res = await googleSignIn();
      if (res) {
        onLoginSucesso(res.user, res.accessToken);
        setMensagemSucesso('Conta Google conectada com sucesso!');
        setTimeout(() => setMensagemSucesso(null), 3000);
      }
    } catch (e: any) {
      setMensagemErro(e.message || 'Falha ao autenticar com o Google');
    } finally {
      setCarregando(false);
    }
  };

  const handleDesconectar = async () => {
    await logoutGoogle();
    onLogoutSucesso();
    setMensagemSucesso('Conta desconectada.');
    setTimeout(() => setMensagemSucesso(null), 2500);
  };

  const handleExportarSheets = async () => {
    if (!token) {
      setMensagemErro('Faça login com sua conta Google primeiro.');
      return;
    }

    const confirmar = window.confirm(
      'Deseja criar/atualizar a planilha no Google Sheets com todas as avaliações consolidadas e notas individuais?'
    );
    if (!confirmar) return;

    setCarregando(true);
    setMensagemErro(null);
    try {
      const res = await exportToGoogleSheets(
        token,
        dissertacoes,
        avaliadores,
        avaliacoes,
        planilhaSalva?.spreadsheetId
      );
      setPlanilhaSalva(res);
      setMensagemSucesso('Planilha do Google Sheets sincronizada com sucesso!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (e: any) {
      console.error(e);
      setMensagemErro(e.message || 'Erro ao sincronizar com Google Sheets');
    } finally {
      setCarregando(false);
    }
  };

  const handleGerarDocs = async () => {
    if (!token) {
      setMensagemErro('Faça login com sua conta Google primeiro.');
      return;
    }

    const confirmar = window.confirm(
      'Deseja confeccionar a Ata Oficial de Deliberação da Comissão no Google Docs?'
    );
    if (!confirmar) return;

    setCarregando(true);
    setMensagemErro(null);
    try {
      const res = await generateAtaGoogleDoc(token, dissertacoes, avaliadores, avaliacoes);
      setDocSalvo(res);
      setMensagemSucesso('Documento da Ata gerado no Google Docs!');
      setTimeout(() => setMensagemSucesso(null), 4000);
    } catch (e: any) {
      console.error(e);
      setMensagemErro(e.message || 'Erro ao gerar documento no Google Docs');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base">
                Google Workspace · Planilha & Documento Oficial
              </h3>
              <p className="text-xs text-stone-400">
                Sincronização no Google Sheets e confecção da Ata no Google Docs
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
          {/* Mensagens de feedback */}
          {mensagemSucesso && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{mensagemSucesso}</span>
            </div>
          )}

          {mensagemErro && (
            <div className="p-3 bg-red-50 border border-red-300 rounded-xl text-xs text-red-800 font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{mensagemErro}</span>
            </div>
          )}

          {/* Estado da Conexão com Google */}
          {!usuario ? (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-5 text-center space-y-3">
              <ShieldCheck className="w-8 h-8 text-amber-700 mx-auto" />
              <div>
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  Conectar ao Google Workspace
                </h4>
                <p className="text-xs text-stone-600 max-w-md mx-auto mt-1">
                  Para gerar a planilha no <strong>Google Sheets</strong> e confeccionar a Ata no <strong>Google Docs</strong>, autentique-se com sua conta Google.
                </p>
              </div>

              {/* Botão Oficial Sign in with Google */}
              <div className="pt-2 flex justify-center">
                <button
                  type="button"
                  onClick={handleConectarGoogle}
                  disabled={carregando}
                  className="px-5 py-2.5 bg-white hover:bg-stone-100 text-stone-800 font-medium text-xs rounded-xl border border-stone-300 shadow-sm flex items-center gap-2.5 transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{carregando ? 'Conectando...' : 'Entrar com o Google'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                {usuario.photoURL ? (
                  <img
                    src={usuario.photoURL}
                    alt={usuario.displayName || 'Usuário'}
                    className="w-10 h-10 rounded-full border border-emerald-300"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-emerald-200 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {usuario.displayName?.slice(0, 2) || 'GS'}
                  </div>
                )}
                <div>
                  <div className="font-bold text-stone-900">{usuario.displayName}</div>
                  <div className="text-stone-500">{usuario.email}</div>
                  <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1 mt-0.5">
                    <Check className="w-3 h-3" /> Conectado ao Google Workspace
                  </span>
                </div>
              </div>

              <button
                onClick={handleDesconectar}
                title="Desconectar conta Google"
                className="px-2.5 py-1.5 text-stone-600 hover:text-red-700 hover:bg-stone-100 rounded-lg border border-stone-200 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair</span>
              </button>
            </div>
          )}

          {/* Card 1: Google Sheets */}
          <div className="p-5 border border-stone-200 rounded-xl bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    1. Planilha do Google Sheets
                  </h4>
                  <p className="text-xs text-stone-500">
                    Gera duas abas: "Quadro Consolidado" e "Notas Detalhadas por Avaliador"
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleExportarSheets}
                disabled={!usuario || carregando}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {carregando ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                )}
                <span>{planilhaSalva ? 'Atualizar Planilha' : 'Criar no Google Sheets'}</span>
              </button>
            </div>

            {planilhaSalva && (
              <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-800 block">{planilhaSalva.title}</span>
                  <span className="text-[11px] text-stone-500">
                    Sincronizada em: {new Date(planilhaSalva.updatedAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <a
                  href={planilhaSalva.spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-md border border-emerald-300 flex items-center gap-1 transition-colors"
                >
                  <span>Abrir Planilha</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>

          {/* Card 2: Google Docs */}
          <div className="p-5 border border-stone-200 rounded-xl bg-white space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-stone-900 text-base">
                    2. Ata Oficial no Google Docs
                  </h4>
                  <p className="text-xs text-stone-500">
                    Cria documento oficial formatado com cabeçalho da UNIVALE, deliberação e assinaturas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGerarDocs}
                disabled={!usuario || carregando}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {carregando ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Gerar no Google Docs</span>
              </button>
            </div>

            {docSalvo && (
              <div className="mt-3 p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-stone-900 block">{docSalvo.title}</span>
                  <span className="text-[11px] text-stone-500">
                    Criado em: {new Date(docSalvo.createdAt).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
                <a
                  href={docSalvo.documentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-md border border-blue-300 flex items-center gap-1 transition-colors"
                >
                  <span>Abrir no Google Docs</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between rounded-b-2xl">
          <span className="text-xs text-stone-500">
            Os arquivos são criados diretamente no seu Google Drive pessoal.
          </span>
          <button
            onClick={onFechar}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
