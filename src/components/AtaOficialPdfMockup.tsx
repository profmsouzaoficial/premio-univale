import React, { useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  CheckCircle2, 
  Award, 
  ShieldCheck, 
  Lock, 
  Gavel,
  FileText,
  Mail,
  Copy,
  Check,
  Database,
} from 'lucide-react';
import { Dissertacao, Avaliador, RankingItem } from '../types';
import { EDITAL_INFO } from '../data/editalData';
import { registrarAtaHomologadaSupabase, LOGO_UNIVALE_URL } from '../services/supabaseClient';


interface AtaOficialPdfMockupProps {
  aberto: boolean;
  onFechar: () => void;
  ranking: RankingItem[];
  avaliadores: Avaliador[];
  isPresidenteAutenticado: boolean;
  onAutenticarPresidente: (senha: string) => boolean;
}

export const AtaOficialPdfMockup: React.FC<AtaOficialPdfMockupProps> = ({
  aberto,
  onFechar,
  ranking,
  avaliadores,
  isPresidenteAutenticado,
  onAutenticarPresidente,
}) => {
  const [senhaTentativa, setSenhaTentativa] = useState('');
  const [erroSenha, setErroSenha] = useState(false);
  const [ataAssinada, setAtaAssinada] = useState(true);
  const [copiado, setCopiado] = useState(false);
  const [salvandoSupabase, setSalvandoSupabase] = useState(false);
  const [salvoSupabaseFeedback, setSalvoSupabaseFeedback] = useState(false);
  const [erroAta, setErroAta] = useState<string | null>(null);

  if (!aberto) return null;

  const presidente = avaliadores.find((a) => a.papel === 'presidente') || avaliadores[4];
  const outrosMembros = avaliadores.filter((a) => a.id !== presidente.id);
  const primeiroLugar = ranking[0];
  const segundoLugar = ranking[1];

  const handleVerificarSenhaPresidente = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = onAutenticarPresidente(senhaTentativa);
    if (!ok) {
      setErroSenha(true);
      setTimeout(() => setErroSenha(false), 3000);
    }
  };

  const handleImprimirPdf = () => {
    window.print();
  };

  // A Ata só pode ser homologada com a comissão inteira concluída
  const totalEsperado = ranking.length * avaliadores.length;
  const totalLancado = ranking.reduce((soma, item) => soma + item.totalAvaliacoes, 0);
  const ataCompleta = totalEsperado > 0 && totalLancado >= totalEsperado;

  const handleSalvarNoSupabase = async () => {
    if (!primeiroLugar) return;

    if (!ataCompleta) {
      setErroAta(`Ata não pode ser homologada: ${totalLancado} de ${totalEsperado} avaliações concluídas. Faltam ${totalEsperado - totalLancado}.`);
      setTimeout(() => setErroAta(null), 6000);
      return;
    }
    setSalvandoSupabase(true);
    const res = await registrarAtaHomologadaSupabase({
      presidenteId: presidente.id,
      vencedoraDissertacaoId: primeiroLugar.dissertacao.id,
      mencaoHonrosaDissertacaoId: segundoLugar?.dissertacao.id,
      rankingConsolidado: ranking,
      hashAutenticidade: 'GIT-2025-ED115-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
      observacoesPresidencia: 'Ata de Deliberação homologada digitalmente pelo Presidente da Comissão.',
    });
    setSalvandoSupabase(false);
    if (res.success) {
      setSalvoSupabaseFeedback(true);
      setTimeout(() => setSalvoSupabaseFeedback(false), 3500);
    }
  };

  const handleCopiarTexto = () => {
    let t = `ATA DE DELIBERAÇÃO FINAL DA COMISSÃO DE AVALIAÇÃO\n`;
    t += `PRÊMIO DE MELHOR DISSERTAÇÃO DO PPG/GIT DE 2025 · EDITAL Nº 115/2026\n`;
    t += `Presidente: ${presidente.nome} (${presidente.instituicao})\n\n`;
    ranking.forEach((r) => {
      t += `${r.posicao > 0 ? `${r.posicao}º LUGAR` : 'SEM AVALIAÇÃO'}: ${r.dissertacao.autor} - Nota Final: ${r.notaMediaFinal100.toFixed(2)} pts (Likert: ${r.mediaLikert75.toFixed(1)}/75 + Livre: ${r.mediaNotaLivre25.toFixed(1)}/25)\n`;
      t += `   "${r.dissertacao.titulo}"\n\n`;
    });
    navigator.clipboard.writeText(t);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-stone-100 border border-stone-300 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[94vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        
        {(erroAta || !ataCompleta) && (
          <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 font-medium flex items-start gap-2 print:hidden">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-700" />
            <span>
              {erroAta ??
                `Ata em elaboração: ${totalLancado} de ${totalEsperado} avaliações concluídas. A homologação será liberada quando a comissão concluir todas.`}
            </span>
          </div>
        )}

        {/* Barra Superior de Controles (Oculta na Impressão) */}
        <div className="p-4 bg-stone-900 text-stone-100 border-b border-stone-800 rounded-t-2xl flex flex-wrap items-center justify-between gap-3 print:hidden">
          <div className="flex items-center gap-2">
            <Gavel className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-sm sm:text-base text-stone-50">
                Ata Oficial da Presidência (Mockup PDF)
              </h3>
              <p className="text-[11px] text-stone-400">
                Documento de deliberação homologado e formatado para exportação e arquivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPresidenteAutenticado && (
              <>
                <button
                  type="button"
                  onClick={handleSalvarNoSupabase}
                  disabled={salvandoSupabase || !ataCompleta}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-lg flex items-center gap-1.5 transition-colors shadow disabled:opacity-60"
                  title={ataCompleta ? 'Salvar Ata Homologada no Banco de Dados Supabase' : `Aguarde as ${totalEsperado} avaliações (${totalLancado} concluídas)`}
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>
                    {salvandoSupabase
                      ? 'Gravando...'
                      : salvoSupabaseFeedback
                      ? 'Salvo no Supabase!'
                      : 'Salvar no Supabase'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleImprimirPdf}
                  className="px-3.5 py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimir / Salvar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopiarTexto}
                  className="px-3 py-1.5 text-xs font-medium text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  {copiado ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiado ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </>
            )}

            <button
              onClick={onFechar}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Bloqueio se não for o Presidente */}
        {!isPresidenteAutenticado ? (
          <div className="p-8 sm:p-12 text-center max-w-md mx-auto my-auto space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 mx-auto">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-stone-900">
                Acesso Restrito ao Presidente da Comissão
              </h3>
              <p className="text-xs text-stone-600 mt-1">
                A confecção e homologação da Ata Oficial é privativa do Presidente da Comissão (<strong>{presidente.nome}</strong>).
              </p>
            </div>

            <form onSubmit={handleVerificarSenhaPresidente} className="space-y-3">
              <div>
                <input
                  type="password"
                  value={senhaTentativa}
                  onChange={(e) => setSenhaTentativa(e.target.value)}
                  placeholder="Digite a credencial de segurança da Presidência..."
                  className="w-full px-3.5 py-2.5 text-xs bg-white border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 text-center font-medium placeholder:text-stone-400"
                />
              </div>

              {erroSenha && (
                <p className="text-xs text-red-600 font-medium">
                  Credencial incorreta. Acesso restrito ao Presidente da Comissão.
                </p>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-sm transition-all"
              >
                Desbloquear e Visualizar Ata Oficial
              </button>
            </form>
          </div>
        ) : (
          /* Folha A4 do Documento Oficial (PDF Mockup) */
          <div className="p-4 sm:p-8 overflow-y-auto print:p-0 print:overflow-visible">
            <div className="bg-white border border-stone-300 rounded-xl shadow-lg p-8 sm:p-14 max-w-3xl mx-auto font-serif text-stone-900 leading-relaxed text-sm print:border-none print:shadow-none print:p-4">
              
              {/* Timbre Oficial com Logotipo da UNIVALE */}
              <div className="text-center pb-6 border-b-2 border-stone-900 space-y-1.5 font-sans">
                <div className="flex justify-center mb-3">
                  <img
                    src={LOGO_UNIVALE_URL}
                    alt="UNIVALE"
                    className="h-16 w-auto object-contain max-w-[220px]"
                  />
                </div>
                <div className="text-xs tracking-widest font-black uppercase text-stone-700">
                  UNIVERSIDADE VALE DO RIO DOCE - UNIVALE
                </div>
                <div className="text-[11px] text-stone-500">
                  Fundação Percival Farquhar · CNPJ 20.611.810/0001-91
                </div>
                <div className="text-xs font-semibold text-stone-800 pt-1">
                  PROGRAMA DE PÓS-GRADUAÇÃO STRICTO SENSU EM GESTÃO INTEGRADA DO TERRITÓRIO (PPG/GIT)
                </div>
                <h1 className="text-base sm:text-lg font-bold text-stone-950 uppercase pt-2">
                  ATA DE JULGAMENTO E DELIBERAÇÃO FINAL DA COMISSÃO DE AVALIAÇÃO
                </h1>
                <p className="text-xs font-semibold text-amber-900">
                  Prêmio de Melhor Dissertação do PPG/GIT de 2025 · Edital UNIVALE Nº 115/2026
                </p>
              </div>

              {/* Preâmbulo */}
              <div className="pt-6 space-y-4 text-justify">
                <p>
                  Aos dezenove dias do mês de novembro do ano de dois mil e vinte e seis, em sessão formal 
                  instituída para os fins do Edital UNIVALE Nº 115/2026, reuniu-se a <strong>Comissão de Avaliação 
                  do Prêmio de Melhor Dissertação do PPG/GIT de 2025</strong>, sob a presidência do professor doutor 
                  <strong> {presidente.nome}</strong> ({presidente.instituicao}) e integrada pelos demais membros 
                  avaliadores: {outrosMembros.map((m) => ` ${m.nome} (${m.instituicao})`).join(';')}.
                </p>

                <p>
                  Instalada a sessão, foram apreciadas as dissertações defendidas no ano de 2025 e indicadas 
                  pelos respectivos laboratórios de pesquisa do PPG/GIT (NEDER, SAIS, NIESD e OBIT). A avaliação 
                  adotou rigorosamente os critérios do Item 5 do Edital, decompostos em 15 afirmações sob a escala Likert 
                  (somatório de 15 a 75 pontos) e Nota Livre atribuída pelo docente (0 a 25 pontos), totalizando a 
                  escala de até 100 pontos, apurada pela média das pontuações atribuídas pelos avaliadores.
                </p>
              </div>

              {/* Tabela de Classificação Homologada */}
              <div className="my-6">
                <div className="text-xs font-sans font-bold uppercase text-stone-800 mb-2">
                  1. Quadro Consolidado das Pontuações e Classificação:
                </div>

                <table className="w-full border-collapse border border-stone-400 text-xs font-sans">
                  <thead>
                    <tr className="bg-stone-100 text-stone-900 border-b border-stone-400">
                      <th className="border border-stone-300 p-2 text-center w-10">Pos.</th>
                      <th className="border border-stone-300 p-2 text-left">Dissertação / Autor(a)</th>
                      <th className="border border-stone-300 p-2 text-left">Laboratório</th>
                      <th className="border border-stone-300 p-2 text-center w-16">Likert (/75)</th>
                      <th className="border border-stone-300 p-2 text-center w-16">Livre (/25)</th>
                      <th className="border border-stone-300 p-2 text-center w-20 bg-stone-200/60 font-bold">Total (/100)</th>
                      <th className="border border-stone-300 p-2 text-center w-16">Escala 5</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ranking.map((item) => (
                      <tr key={item.dissertacao.id} className="border-b border-stone-300">
                        <td className="border border-stone-300 p-2 text-center font-bold">
                          {item.posicao > 0 ? `${item.posicao}º` : '—'}
                        </td>
                        <td className="border border-stone-300 p-2">
                          <div className="font-bold text-stone-900">{item.dissertacao.autor}</div>
                          <div className="text-[11px] italic text-stone-600 font-serif">"{item.dissertacao.titulo}"</div>
                          {item.criterioDesempateAplicado && (
                            <div className="text-[10px] text-amber-900 font-sans font-semibold mt-0.5">
                              Desempate: {item.criterioDesempateAplicado}
                            </div>
                          )}
                        </td>
                        <td className="border border-stone-300 p-2 text-stone-700">
                          {item.dissertacao.laboratorio}
                        </td>
                        <td className="border border-stone-300 p-2 text-center font-mono">
                          {item.mediaLikert75.toFixed(1)}
                        </td>
                        <td className="border border-stone-300 p-2 text-center font-mono">
                          +{item.mediaNotaLivre25.toFixed(1)}
                        </td>
                        <td className="border border-stone-300 p-2 text-center font-mono font-black text-stone-950 bg-stone-100">
                          {item.notaMediaFinal100.toFixed(2)}
                        </td>
                        <td className="border border-stone-300 p-2 text-center font-mono text-stone-700">
                          {item.notaMediaEscala5.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Deliberação dos Vencedores */}
              <div className="space-y-4 text-justify">
                <div className="text-xs font-sans font-bold uppercase text-stone-800 mb-1">
                  2. Proclamação da Vencedora e Menção Honrosa:
                </div>

                {primeiroLugar && (
                  <p>
                    <strong>I. VENCEDOR DO PRÊMIO DE MELHOR DISSERTAÇÃO PPG/GIT 2025: </strong> 
                    Com base no Item 5.2.3 do Edital, a Comissão declara vencedora a dissertação 
                    <em> "{primeiroLugar.dissertacao.titulo}"</em>, de autoria do egresso 
                    <strong> {primeiroLugar.dissertacao.autor}</strong>, que alcançou a pontuação média de 
                    <strong> {primeiroLugar.notaMediaFinal100.toFixed(2)} pontos</strong>. 
                    Conforme o Item 4.1.III do Edital, é outorgada a oportunidade editorial junto à 
                    <strong> UNIVALE Editora</strong> para a publicação da obra em formato e-book.
                  </p>
                )}

                {segundoLugar && (
                  <p>
                    <strong>II. ATRIBUIÇÃO DE MENÇÃO HONROSA: </strong> 
                    Com fundamento no Item 3.4 do Edital e com a aprovação formal da comissão avaliadora, 
                    confere-se <strong>MENÇÃO HONROSA</strong> à dissertação classificada em segundo lugar: 
                    <em> "{segundoLugar.dissertacao.titulo}"</em>, de autoria de <strong>{segundoLugar.dissertacao.autor}</strong>, 
                    com média de <strong>{segundoLugar.notaMediaFinal100.toFixed(2)} pontos</strong>.
                  </p>
                )}

                <p>
                  Lavrada a presente Ata sob fé da Presidência, segue subscrita pelos avaliadores para encaminhamento 
                  imediato à Coordenação do PPG/GIT da UNIVALE.
                </p>
              </div>

              {/* Assinaturas dos 6 Avaliadores em Ordem Alfabética com o Presidente */}
              <div className="pt-10 space-y-8 font-sans">
                <div className="text-center text-xs text-stone-600">
                  Governador Valadares/MG, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 text-center">
                  <div className="space-y-1">
                    <div className="border-t border-stone-800 pt-1.5 font-bold text-xs text-stone-900">
                      {presidente.nome}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-900">Presidente da Comissão</div>
                    <div className="text-[10px] text-stone-500">{presidente.instituicao}</div>
                  </div>

                  {outrosMembros.map((m) => (
                    <div key={m.id} className="space-y-1">
                      <div className="border-t border-stone-800 pt-1.5 font-bold text-xs text-stone-900">
                        {m.nome}
                      </div>
                      <div className="text-[11px] text-stone-600">Membro Avaliador</div>
                      <div className="text-[10px] text-stone-500">{m.instituicao}</div>
                    </div>
                  ))}
                </div>

                {/* Selo de Certificação Oficial */}
                <div className="mt-8 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
                  <span className="flex items-center gap-1 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Documento Oficial Registrado · Sistema da Comissão GIT/UNIVALE
                  </span>
                  <span className="font-mono">Código de Autenticação: GIT-2025-ED115</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer do Modal */}
        <div className="p-4 bg-stone-200/80 border-t border-stone-300 rounded-b-2xl flex items-center justify-between print:hidden">
          <span className="text-xs text-stone-600">
            Mockup fiel em padrão A4 para visualização da Ata Oficial.
          </span>
          <button
            onClick={onFechar}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-300 border border-stone-400 rounded-lg transition-colors"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
