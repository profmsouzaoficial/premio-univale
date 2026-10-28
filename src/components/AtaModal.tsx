import React from 'react';
import { X, Printer, Award } from 'lucide-react';
import { Avaliador, RankingItem } from '../types';
import { LOGO_UNIVALE_URL } from '../services/supabaseClient';

interface AtaModalProps {
  aberto: boolean;
  onFechar: () => void;
  ranking: RankingItem[];
  avaliadores: Avaliador[];
}

export const AtaModal: React.FC<AtaModalProps> = ({
  aberto,
  onFechar,
  ranking,
  avaliadores,
}) => {
  if (!aberto) return null;

  const presidente = avaliadores.find((a) => a.papel === 'presidente') || avaliadores[0];
  const outrosMembros = avaliadores.filter((a) => a.id !== presidente.id);
  const primeiroLugar = ranking[0];
  const segundoLugar = ranking[1];

  const handleImprimir = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white print:static">
      <div className="bg-white border border-stone-300 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[92vh] print:max-h-none print:border-none print:shadow-none print:rounded-none">
        {/* Header de controles do modal (não sai na impressão) */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-stone-100 rounded-t-2xl print:hidden">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-400" />
            <h3 className="font-serif font-bold text-sm sm:text-base">
              Ata Oficial de Julgamento da Comissão Avaliadora
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleImprimir}
              className="px-3.5 py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1.5 transition-colors shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
            <button
              onClick={onFechar}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteúdo Imprimível da Ata */}
        <div className="p-8 sm:p-12 overflow-y-auto print:p-6 print:overflow-visible font-serif text-stone-900 leading-relaxed text-sm">
          {/* Cabeçalho Institucional Oficial */}
          <div className="text-center pb-6 border-b-2 border-stone-800 space-y-1.5">
            <div className="flex justify-center mb-3">
              <img
                src={LOGO_UNIVALE_URL}
                alt="Logotipo Oficial UNIVALE"
                className="h-16 w-auto object-contain max-w-[200px]"
              />
            </div>
            <div className="text-xs font-sans tracking-widest font-bold uppercase text-stone-600">
              UNIVERSIDADE VALE DO RIO DOCE - UNIVALE
            </div>
            <div className="text-[11px] font-sans text-stone-500">
              Fundação Percival Farquhar · CNPJ 20.611.810/0001-91
            </div>
            <div className="text-xs font-sans font-semibold text-stone-800 pt-1">
              PROGRAMA DE PÓS-GRADUAÇÃO STRICTO SENSU EM GESTÃO INTEGRADA DO TERRITÓRIO (PPG/GIT)
            </div>
            <h1 className="text-base sm:text-lg font-bold text-stone-950 uppercase pt-2">
              ATA DE DELIBERAÇÃO FINAL DA COMISSÃO DE AVALIAÇÃO
            </h1>
            <p className="text-xs font-sans text-stone-600 font-medium">
              Prêmio de Melhor Dissertação do PPG/GIT de 2025 · Edital UNIVALE Nº 115/2026
            </p>
          </div>

          {/* Preâmbulo */}
          <div className="pt-6 space-y-4 text-justify">
            <p>
              Aos dezenove dias do mês de novembro do ano de dois mil e vinte e seis, reuniu-se a 
              <strong> Comissão de Avaliação do Prêmio de Melhor Dissertação do PPG/GIT de 2025</strong>, 
              constituída na forma do Edital UNIVALE Nº 115/2026, integrada pelos professores avaliadores: 
              <strong> {presidente.nome}</strong> ({presidente.instituicao}), no exercício da Presidência da Comissão; 
              {outrosMembros.map((m, i) => (
                <span key={m.id}>
                  {i > 0 ? '; ' : ' '}
                  <strong>{m.nome}</strong> ({m.instituicao}), Membro Avaliador
                </span>
              ))}.
            </p>

            <p>
              Instalada a sessão de deliberação, a Comissão procedeu à consolidação das notas atribuídas às 
              dissertações defendidas em 2025 e indicadas pelos laboratórios de pesquisa do PPG/GIT — a saber: 
              Núcleo de Estudos sobre Desenvolvimento Regional (NEDER), Laboratório de Pesquisa Saúde, Indivíduo e 
              Sociedade (SAIS), Núcleo Interdisciplinar de Educação, Saúde e Direitos (NIESD) e Observatório 
              Interdisciplinar do Território (OBIT). A sistemática avaliativa seguiu o desdobramento dos 5 critérios 
              do Edital em 15 afirmações Likert (somatório de 15 a 75 pontos) conjugado com a Nota Livre Docente 
              (0 a 25 pontos), totalizando a escala centesimal de até 100 pontos, apurada pela média aritmética dos avaliadores.
            </p>
          </div>

          {/* Quadro de Resultados */}
          <div className="my-6">
            <div className="text-xs font-sans font-bold uppercase text-stone-700 mb-2">
              1. Classificação Final Homologada pela Comissão:
            </div>
            <table className="w-full border-collapse border border-stone-400 text-xs font-sans">
              <thead>
                <tr className="bg-stone-100 text-stone-900 border-b border-stone-400">
                  <th className="border border-stone-300 p-2 text-center w-10">Pos.</th>
                  <th className="border border-stone-300 p-2 text-left">Dissertação / Autor(a)</th>
                  <th className="border border-stone-300 p-2 text-left">Laboratório</th>
                  <th className="border border-stone-300 p-2 text-center w-20">Likert (75)</th>
                  <th className="border border-stone-300 p-2 text-center w-20">Livre (25)</th>
                  <th className="border border-stone-300 p-2 text-center w-24">Média Final (100)</th>
                  <th className="border border-stone-300 p-2 text-center w-16">Escala (0-5)</th>
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
                    <td className="border border-stone-300 p-2 text-center font-mono font-bold text-stone-900 text-sm">
                      {item.notaMediaFinal100.toFixed(2)}
                    </td>
                    <td className="border border-stone-300 p-2 text-center font-mono text-stone-800">
                      {item.notaMediaEscala5.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Deliberação e Proclamação dos Resultados */}
          <div className="space-y-4 text-justify">
            <div className="text-xs font-sans font-bold uppercase text-stone-700 mb-1">
              2. Proclamação dos Vencedores e Menção Honrosa:
            </div>

            {primeiroLugar && (
              <p>
                <strong>I. Primeiro Lugar (Vencedora do Prêmio de Melhor Dissertação PPG/GIT 2025): </strong> 
                Conforme o Item 5.2.3 do Edital, a Comissão declara como vencedora a dissertação intitulada 
                <em> "{primeiroLugar.dissertacao.titulo}"</em>, de autoria de <strong>{primeiroLugar.dissertacao.autor}</strong>, 
                que obteve a maior pontuação média final de <strong>{primeiroLugar.notaMediaFinal100.toFixed(2)} pontos</strong>. 
                Farão jus ao certificado de premiação o egresso autor, seu orientador e coorientador, bem como à 
                oportunidade editorial junto à <strong>UNIVALE Editora</strong> para a publicação da obra em formato e-book, 
                atendidos os requisitos do Item 4.1.III do Edital.
              </p>
            )}

            {segundoLugar && (
              <p>
                <strong>II. Atribuição de Menção Honrosa: </strong> 
                Com fundamento no Item 3.4 e Item 4.1.II do Edital, a Comissão de Avaliação, considerando o parecer favorável 
                de seus membros ({segundoLugar.votosMencaoHonrosa} indicações), decide conferir <strong>MENÇÃO HONROSA</strong> à dissertação 
                classificada em segundo lugar, de título <em> "{segundoLugar.dissertacao.titulo}"</em>, de autoria de 
                <strong> {segundoLugar.dissertacao.autor}</strong>, com a média de <strong>{segundoLugar.notaMediaFinal100.toFixed(2)} pontos</strong>, 
                em virtude de sua destacada relevância científica, rigor investigativo e contribuição ao desenvolvimento do território.
              </p>
            )}

            <p>
              Nada mais havendo a constar, lavrou-se a presente ata que, após lida e achada conforme por todos os 
              membros da Comissão de Avaliação, segue assinada para envio imediato à Coordenação do Programa de 
              Pós-Graduação em Gestão Integrada do Território (territorio@univale.br) para publicação oficial e 
              cumprimento dos prazos recursais previstos no Edital.
            </p>
          </div>

          {/* Campo de Assinaturas com todos os avaliadores */}
          <div className="pt-12 text-center space-y-10">
            <div className="text-xs font-sans text-stone-600">
              Governador Valadares/MG, {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}.
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6">
              <div className="space-y-1">
                <div className="border-t border-stone-800 pt-2 font-bold text-xs font-sans">
                  {presidente.nome}
                </div>
                <div className="text-[11px] font-sans text-stone-600 font-semibold">Presidente da Comissão</div>
                <div className="text-[10px] font-sans text-stone-500">{presidente.instituicao}</div>
              </div>

              {outrosMembros.map((m) => (
                <div key={m.id} className="space-y-1">
                  <div className="border-t border-stone-800 pt-2 font-bold text-xs font-sans">
                    {m.nome}
                  </div>
                  <div className="text-[11px] font-sans text-stone-600">Membro Avaliador</div>
                  <div className="text-[10px] font-sans text-stone-500">{m.instituicao}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rodapé do modal */}
        <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between rounded-b-2xl print:hidden">
          <span className="text-xs text-stone-500 font-sans">
            Documento em conformidade com o Edital UNIVALE Nº 115/2026.
          </span>
          <button
            onClick={onFechar}
            className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 border border-stone-300 rounded-lg transition-colors"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};
