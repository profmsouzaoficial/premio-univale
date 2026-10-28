import { Criterio } from '../types';

export const LIKERT_ESCALA = [
  { valor: 1, label: 'Discordo Totalmente', desc: 'Não atende ao requisito acadêmico esperado.', cor: 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100' },
  { valor: 2, label: 'Discordo Parcialmente', desc: 'Atendimento insatisfatório ou com falhas relevantes.', cor: 'border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100' },
  { valor: 3, label: 'Neutro', desc: 'Atendimento mediano, regular ou com ressalvas pontuais.', cor: 'border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100' },
  { valor: 4, label: 'Concordo Parcialmente', desc: 'Bom atendimento ao padrão acadêmico com méritos claros.', cor: 'border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100' },
  { valor: 5, label: 'Concordo Totalmente', desc: 'Excelência exemplar, rigor irrepreensível e alta qualidade.', cor: 'border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' },
] as const;

export const CRITERIOS_AVALIACAO: Criterio[] = [
  {
    id: 1,
    numero: '1',
    nome: 'Qualidade de escrita e coesão textual',
    descricao: 'Avalia a redação acadêmica, correção gramatical, rigor estilístico, clareza lógica e maturidade formal da dissertação.',
    subcriterios: [
      {
        id: '1.1',
        titulo: 'Clareza e fluidez',
        afirmacao: 'O texto apresenta leitura fluida, objetiva e está livre de erros gramaticais, ortográficos ou de formatação que prejudiquem a compreensão.',
      },
      {
        id: '1.2',
        titulo: 'Encadeamento lógico',
        afirmacao: 'Há coesão e coerência consistentes entre os parágrafos, seções e capítulos, construindo uma argumentação sólida do início ao fim.',
      },
      {
        id: '1.3',
        titulo: 'Maturidade acadêmica',
        afirmacao: 'A linguagem utilizada reflete alto nível de maturidade científica e adequação ao padrão acadêmico exigido em nível de mestrado.',
      },
    ],
  },
  {
    id: 2,
    numero: '2',
    nome: 'Originalidade e contribuição à(s) área(s) de pesquisa',
    descricao: 'Avalia o ineditismo da investigação, o avanço no estado da arte e a relevância das conclusões para a Gestão Integrada do Território.',
    subcriterios: [
      {
        id: '2.1',
        titulo: 'Ineditismo da abordagem',
        afirmacao: 'O problema de pesquisa, a lente teórica adotada ou o objeto empírico demonstram originalidade clara dentro do campo de estudo.',
      },
      {
        id: '2.2',
        titulo: 'Preenchimento de lacunas',
        afirmacao: 'A dissertação preenche uma lacuna científica comprovada, avançando o estado da arte na área de Gestão Integrada do Território.',
      },
      {
        id: '2.3',
        titulo: 'Geração de conhecimento',
        afirmacao: 'As conclusões geram contribuições teóricas ou empíricas significativas e passíveis de publicação em veículos científicos de alto impacto.',
      },
    ],
  },
  {
    id: 3,
    numero: '3',
    nome: 'Qualidade e rigor metodológico',
    descricao: 'Avalia a adequação do desenho de pesquisa, a consistência dos instrumentos de coleta e a solidez e transparência das análises.',
    subcriterios: [
      {
        id: '3.1',
        titulo: 'Adequação do desenho de pesquisa',
        afirmacao: 'Os procedimentos metodológicos (qualitativos, quantitativos ou mistos) escolhidos são os mais adequados para responder diretamente à pergunta de pesquisa.',
      },
      {
        id: '3.2',
        titulo: 'Transparência e replicabilidade',
        afirmacao: 'A descrição do percurso metodológico é detalhada e transparente o suficiente para permitir a compreensão total e a possível replicação do estudo.',
      },
      {
        id: '3.3',
        titulo: 'Consistência analítica',
        afirmacao: 'A coleta, o processamento e a análise de dados foram conduzidos com rigor científico, sem vieses evidentes, sustentando de forma válida os resultados encontrados.',
      },
    ],
  },
  {
    id: 4,
    numero: '4',
    nome: 'Relevância e impacto social da pesquisa',
    descricao: 'Avalia a conexão do tema com desafios reais da sociedade e o potencial transformador para o desenvolvimento territorial regional.',
    subcriterios: [
      {
        id: '4.1',
        titulo: 'Alinhamento com demandas reais',
        afirmacao: 'A pesquisa aborda um problema contemporâneo de alta relevância para a sociedade e para o território estudado.',
      },
      {
        id: '4.2',
        titulo: 'Aplicabilidade prática',
        afirmacao: 'Os resultados, produtos ou tecnologias sociais derivados do estudo apresentam potencial claro de aplicação para solucionar demandas da comunidade.',
      },
      {
        id: '4.3',
        titulo: 'Potencial transformador',
        afirmacao: 'O trabalho promove, direta ou indiretamente, o desenvolvimento social, econômico, cultural ou ambiental da região.',
      },
    ],
  },
  {
    id: 5,
    numero: '5',
    nome: 'Fundamentação teórica',
    descricao: 'Avalia a abrangência bibliográfica, a profundidade crítica na mobilização dos referenciais e o suporte aos achados empíricos.',
    subcriterios: [
      {
        id: '5.1',
        titulo: 'Abrangência e atualização',
        afirmacao: 'A revisão de literatura é robusta, atualizada e mobiliza os principais autores e evidências (nacionais e internacionais) indispensáveis ao tema.',
      },
      {
        id: '5.2',
        titulo: 'Diálogo crítico',
        afirmacao: 'O autor estabelece um diálogo crítico, analítico e articulado com a literatura, ultrapassando a mera exposição descritiva de citações.',
      },
      {
        id: '5.3',
        titulo: 'Sustentação dos resultados',
        afirmacao: 'O referencial teórico construído fornece o suporte conceitual necessário e é efetivamente utilizado na discussão dos resultados da pesquisa.',
      },
    ],
  },
];
