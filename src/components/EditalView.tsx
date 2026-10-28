import React, { useState } from 'react';
import { 
  BookOpen, 
  Calendar, 
  FileText, 
  ExternalLink, 
  Award, 
  CheckCircle2, 
  ShieldCheck, 
  Download,
  Eye,
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { EDITAL_INFO } from '../data/editalData';
import { CRITERIOS_AVALIACAO } from '../data/criteriosData';
import { LOGO_UNIVALE_URL } from '../services/supabaseClient';

export const EditalView: React.FC = () => {
  const [modoVisualizacao, setModoVisualizacao] = useState<'transcricao' | 'embutido'>('transcricao');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h-10 px-2.5 py-1 rounded-lg bg-white border border-stone-300 flex items-center justify-center shadow-xs">
                <img
                  src={LOGO_UNIVALE_URL}
                  alt="UNIVALE"
                  className="h-7 w-auto object-contain max-w-[120px]"
                />
              </div>
              <span className="text-xs uppercase font-mono font-bold text-amber-700 tracking-wider">
                Documento Normativo Oficial · PPG/GIT
              </span>
            </div>

            <h2 className="text-2xl font-serif font-bold text-stone-900">
              {EDITAL_INFO.numero}
            </h2>
            <p className="text-sm text-stone-600">
              {EDITAL_INFO.titulo} · {EDITAL_INFO.programa} · {EDITAL_INFO.instituicao}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={EDITAL_INFO.supabasePdfUrl || EDITAL_INFO.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-xs font-bold text-white bg-stone-900 hover:bg-stone-800 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              <span>Abrir PDF Oficial no Supabase</span>
            </a>

            <a
              href={EDITAL_INFO.supabasePdfUrl || EDITAL_INFO.pdfPath}
              download="edital_univale_115_2026.pdf"
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-300 rounded-lg flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar Edital PDF</span>
            </a>
          </div>
        </div>
      </div>

      {/* Cronograma do Processo */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <Calendar className="w-5 h-5 text-amber-600" />
          <h3 className="font-serif font-bold text-stone-900 text-lg">
            Cronograma Oficial da Premiação (Item 7.1)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {EDITAL_INFO.cronograma.map((etapa, idx) => {
            const isPrazoComissao = idx === 1;

            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border text-xs flex flex-col justify-between gap-2 ${
                  isPrazoComissao
                    ? 'border-amber-400 bg-amber-50/50 ring-1 ring-amber-400'
                    : 'border-stone-200 bg-stone-50'
                }`}
              >
                <div>
                  <span className="text-[10px] font-mono uppercase text-stone-400 block mb-1">
                    Etapa {idx + 1}
                  </span>
                  <p className="font-medium text-stone-800 leading-snug">
                    {etapa.atividade}
                  </p>
                </div>
                <div className="font-mono font-bold text-stone-900 pt-2 border-t border-stone-200/60">
                  {etapa.data}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critérios do Edital Desdobrados na Escala Likert */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
          <Award className="w-5 h-5 text-stone-800" />
          <div>
            <h3 className="font-serif font-bold text-stone-900 text-lg">
              Critérios de Avaliação (Item 5.1 e 5.2 do Edital)
            </h3>
            <p className="text-xs text-stone-500">
              Todos os critérios possuem o mesmo peso. Foram desdobrados em 3 afirmações cada (15 no total), avaliadas de 1 a 5.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {CRITERIOS_AVALIACAO.map((criterio) => (
            <div key={criterio.id} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded bg-stone-900 text-white font-mono text-xs font-bold flex items-center justify-center">
                  {criterio.numero}
                </span>
                <h4 className="font-serif font-bold text-stone-900 text-base">
                  {criterio.nome}
                </h4>
              </div>
              <p className="text-xs text-stone-600 italic pl-8">
                {criterio.descricao}
              </p>

              <div className="pl-8 grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                {criterio.subcriterios.map((sub) => (
                  <div key={sub.id} className="p-3 bg-white rounded-lg border border-stone-200 text-xs space-y-1">
                    <span className="font-mono font-bold text-amber-800 block">
                      {sub.id} · {sub.titulo}
                    </span>
                    <p className="text-stone-700 leading-relaxed">
                      {sub.afirmacao}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seletor de Leitura do Edital: Texto Integral Formatado ou Visualizador PDF */}
      <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-700" />
            <div>
              <h3 className="font-serif font-bold text-stone-900 text-base sm:text-lg">
                Edital UNIVALE Nº 115/2026 na Íntegra
              </h3>
              <p className="text-xs text-stone-500">
                Texto normativo completo assinado pela Reitoria da UNIVALE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-stone-200/80 p-1 rounded-lg flex items-center text-xs">
              <button
                type="button"
                onClick={() => setModoVisualizacao('transcricao')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  modoVisualizacao === 'transcricao'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Texto Formatado
              </button>
              <button
                type="button"
                onClick={() => setModoVisualizacao('embutido')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  modoVisualizacao === 'embutido'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Visualizador PDF
              </button>
            </div>

            <a
              href={EDITAL_INFO.pdfPath}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200/60 transition-colors"
              title="Abrir arquivo PDF em nova aba"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {modoVisualizacao === 'transcricao' ? (
          <div className="p-6 sm:p-10 font-serif text-stone-900 leading-relaxed text-sm space-y-6 max-w-4xl mx-auto">
            {/* Cabeçalho do Documento */}
            <div className="text-center pb-6 border-b-2 border-stone-800 space-y-1 font-sans">
              <div className="text-xs tracking-widest font-bold uppercase text-stone-700">
                UNIVERSIDADE VALE DO RIO DOCE - UNIVALE
              </div>
              <div className="text-xs text-stone-500">
                Fundação Percival Farquhar - Entidade Mantenedora · CNPJ 20.611.810/0001-91
              </div>
              <div className="text-sm font-bold text-stone-900 pt-2 uppercase">
                Edital UNIVALE Nº 115/2026
              </div>
              <div className="text-base font-bold text-amber-900">
                Prêmio de Melhor Dissertação do PPG/GIT de 2025
              </div>
            </div>

            <p className="text-justify text-xs sm:text-sm text-stone-700">
              A Universidade Vale do Rio Doce – UNIVALE, mantida pela Fundação Percival Farquhar, inscrita no CNPJ sob o nº 20.611.810/0001-91, com sede no município de Governador Valadares/MG, torna público o edital do Prêmio de Melhor Dissertação do Programa de Pós-Graduação em Gestão Integrada do Território (PPG/GIT), referente às dissertações defendidas no ano de 2025 no PPG/GIT e inscritas na base de dados da Biblioteca da UNIVALE.
            </p>

            {/* 1. DAS DISPOSIÇÕES GERAIS */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-stone-900 text-sm uppercase">
                1. DAS DISPOSIÇÕES GERAIS
              </h4>
              <p className="text-justify">
                <strong>1.1</strong> O Prêmio de Melhor Dissertação do PPG/GIT de 2025 será outorgado para as dissertações defendidas em 2025, selecionadas e indicadas pelos 4 (quatro) laboratórios do PPG/GIT, atendidos os critérios do presente edital.
              </p>
              <p className="text-justify pl-4">
                <strong>1.1.1</strong> Os laboratórios do PPG/GIT são: o Núcleo de Estudos sobre Desenvolvimento Regional (NEDER), Laboratório de Pesquisa Saúde, Indivíduo e Sociedade (SAIS), Núcleo Interdisciplinar de Educação, Saúde e Direitos (NIESD), Observatório Interdisciplinar do Território (OBIT).
              </p>
              <p className="text-justify">
                <strong>1.2</strong> Para concorrerem ao Prêmio de Melhor Dissertação do PPG/GIT, as dissertações devem, obrigatoriamente, atender aos seguintes critérios de elegibilidade:
              </p>
              <ul className="list-disc pl-8 space-y-1 text-stone-800">
                <li>I. terem sido defendidas em 2025;</li>
                <li>II. terem sido indicadas pelo laboratório ao qual o egresso esteve vinculado no ano de 2025;</li>
                <li>III. estarem registradas na base de dados da Biblioteca da UNIVALE até a data de sua indicação ao prêmio.</li>
              </ul>
            </div>

            {/* 2. DA INDICAÇÃO */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-stone-900 text-sm uppercase">
                2. DA INDICAÇÃO DAS DISSERTAÇÕES
              </h4>
              <p className="text-justify">
                <strong>2.1</strong> A indicação das dissertações para o Prêmio de Melhor Dissertação do PPG/GIT de 2025 será de responsabilidade dos coordenadores dos laboratórios do GIT.
              </p>
              <p className="text-justify">
                <strong>2.2</strong> Cada laboratório realizará a indicação de uma dissertação, levando em consideração a adequação das dissertações aos critérios estabelecidos neste item e o elevado patamar de qualidade exigido pela premiação (qualidade da escrita acadêmica, originalidade da obra, relevância e impacto social da pesquisa).
              </p>
            </div>

            {/* 3. DA COMISSÃO DE AVALIAÇÃO */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-stone-900 text-sm uppercase">
                3. DA COMPOSIÇÃO DA COMISSÃO DE AVALIAÇÃO
              </h4>
              <p className="text-justify">
                <strong>3.1</strong> Será formada uma comissão de avaliação composta por três membros externos ao PPG/GIT.
              </p>
              <p className="text-justify">
                <strong>3.2</strong> Os membros da comissão de avaliação serão escolhidos seguindo os seguintes critérios: possuir título de doutorado e reconhecida experiência na área; estar vinculado a uma Instituição de Ensino Superior (IES) brasileira ou estrangeira; assegurar a diversidade de áreas de formação e atuação dos membros da comissão.
              </p>
              <p className="text-justify">
                <strong>3.3</strong> É vedada a participação na comissão de avaliação de orientadores e coorientadores das dissertações concorrentes, bem como de parentes até o terceiro grau.
              </p>
              <p className="text-justify">
                <strong>3.4</strong> A comissão de avaliação poderá decidir pela atribuição, ou não, de uma menção honrosa ao segundo colocado da pontuação final.
              </p>
            </div>

            {/* 4. DA PREMIAÇÃO */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-stone-900 text-sm uppercase">
                4. DA PREMIAÇÃO
              </h4>
              <p className="text-justify">
                <strong>4.1</strong> O Prêmio de Melhor Dissertação do PPG/GIT de 2025 consiste em:
              </p>
              <ul className="list-disc pl-8 space-y-1 text-stone-800">
                <li>I. Certificado de premiação de melhor dissertação ao orientador, coorientador e ao egresso autor da dissertação vencedora (1º lugar);</li>
                <li>II. Certificado de menção honrosa ao egresso classificado em segundo lugar, caso a comissão assim delibere (Item 3.4);</li>
                <li>III. Oportunidade editorial junto à UNIVALE Editora para publicação de um e-book da dissertação vencedora.</li>
              </ul>
            </div>

            {/* 5. DOS CRITÉRIOS DE AVALIAÇÃO */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-stone-900 text-sm uppercase">
                5. DOS CRITÉRIOS DE AVALIAÇÃO
              </h4>
              <p className="text-justify">
                <strong>5.1</strong> As dissertações indicadas serão analisadas sob os seguintes aspectos: a. qualidade de escrita e coesão textual; b. originalidade e contribuição à(s) área(s) de pesquisa; c. qualidade e rigor metodológico; d. relevância e impacto social; e. fundamentação teórica.
              </p>
              <p className="text-justify">
                <strong>5.2</strong> Cada um dos critérios mencionados terá o mesmo peso na nota final da premiação. A pontuação total de cada dissertação será obtida pela média das pontuações atribuídas pelos avaliadores.
              </p>
              <p className="text-justify">
                <strong>5.2.3.1</strong> Em caso de empate na classificação, terá preferência a dissertação cujo autor tenha concluído o curso em menor tempo, contado em dias entre a primeira matrícula regular no PPG/GIT e a defesa.
              </p>
              <p className="text-justify">
                <strong>5.2.3.2</strong> Persistindo o empate, serão consideradas sucessivamente as maiores médias nos critérios: 1) qualidade e rigor metodológico; 2) originalidade e contribuição; 3) relevância e impacto social; 4) fundamentação teórica; 5) qualidade de escrita e coesão textual.
              </p>
            </div>

            {/* 6. DO RESULTADO E RECURSOS */}
            <div className="space-y-2">
              <h4 className="font-sans font-bold text-stone-900 text-sm uppercase">
                6. DO RESULTADO E DOS RECURSOS ADMINISTRATIVOS
              </h4>
              <p className="text-justify">
                <strong>6.1</strong> O resultado preliminar da seleção será divulgado no dia 19 de novembro de 2026. Recursos poderão ser apresentados de 20 a 24 de novembro de 2026 pelo e-mail <em>territorio@univale.br</em>.
              </p>
              <p className="text-justify">
                <strong>6.2</strong> O resultado final homologado será divulgado no dia 28 de novembro de 2026.
              </p>
            </div>

            {/* Assinatura */}
            <div className="pt-8 text-center space-y-1 font-sans text-xs">
              <p>Governador Valadares, 07 de outubro de 2026.</p>
              <p className="font-bold text-stone-900 pt-4">Profa. Dra. Lissandra Lopes Coelho Rocha</p>
              <p className="text-stone-500">Reitora da Universidade Vale do Rio Doce – UNIVALE</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-stone-700 flex items-center justify-between">
              <span>Se o seu navegador bloquear o leitor embutido de PDF abaixo, utilize o botão ao lado:</span>
              <a
                href={EDITAL_INFO.pdfPath}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-amber-800 underline flex items-center gap-1 shrink-0 ml-2"
              >
                <span>Abrir PDF Completo</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="w-full h-[700px] bg-stone-100 rounded-lg overflow-hidden border border-stone-300">
              <object
                data={`${EDITAL_INFO.pdfPath}#view=FitH`}
                type="application/pdf"
                className="w-full h-full"
              >
                <div className="flex flex-col items-center justify-center h-full p-6 text-center text-stone-600 space-y-3">
                  <FileText className="w-12 h-12 text-stone-400" />
                  <p className="text-sm font-semibold">O visualizador nativo de PDF não pôde ser carregado diretamente neste frame.</p>
                  <a
                    href={EDITAL_INFO.pdfPath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-500 rounded-lg flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Baixar / Abrir Arquivo PDF do Edital</span>
                  </a>
                </div>
              </object>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
