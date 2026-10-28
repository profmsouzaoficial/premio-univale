export const EDITAL_INFO = {
  numero: 'Edital UNIVALE Nº 115/2026',
  titulo: 'Prêmio de Melhor Dissertação do PPG/GIT de 2025',
  instituicao: 'Universidade Vale do Rio Doce - UNIVALE',
  mantenedora: 'Fundação Percival Farquhar (CNPJ 20.611.810/0001-91)',
  programa: 'Programa de Pós-Graduação em Gestão Integrada do Território (PPG/GIT)',
  cidade: 'Governador Valadares/MG',
  emailContato: 'territorio@univale.br',
  pdfPath: '/assets/aistudio/Edital-UNIVALE-115-2026-Premio-de-Melhor-Dissertacao-do-PPGGIT-de-2025_af87cf43.pdf',
  supabasePdfUrl: 'https://pwusflbyvamjnfmuvagy.supabase.co/storage/v1/object/public/dissertacoes/edital_univale_115_2026.pdf',
  
  cronograma: [
    { atividade: 'Indicação das dissertações pelos laboratórios do PPG/GIT', data: 'Até 9 de outubro de 2026' },
    { atividade: 'Prazo da Comissão de Avaliação para envio do Parecer', data: 'Até 19 de novembro de 2026' },
    { atividade: 'Divulgação do resultado preliminar oficial', data: '19 de novembro de 2026' },
    { atividade: 'Prazo final para interposição de recursos', data: '20 a 24 de novembro de 2026 (até 23h59)' },
    { atividade: 'Divulgação do resultado final homologado', data: '28 de novembro de 2026' },
  ],

  artigosPrincipais: [
    {
      item: '3.1 & 3.2',
      titulo: 'Composição da Comissão de Avaliação',
      texto: 'Comissão formada por três membros externos ao PPG/GIT, portadores de título de doutorado, vinculados a IES brasileira ou estrangeira, assegurada a interdisciplinaridade.'
    },
    {
      item: '3.4',
      titulo: 'Menção Honrosa',
      texto: 'A comissão de avaliação poderá decidir pela atribuição, ou não, de uma menção honrosa ao segundo colocado da pontuação final.'
    },
    {
      item: '4.1',
      titulo: 'Premiação e Oportunidade Editorial',
      texto: 'Certificado de premiação de melhor dissertação ao egresso, orientador e coorientador; oportunidade editorial junto à UNIVALE Editora para a publicação de um e-book da dissertação vencedora do primeiro lugar.'
    },
    {
      item: '5.2',
      titulo: 'Pesos e Escalas',
      texto: 'Cada um dos 5 critérios terá o mesmo peso na nota final. A nota final é calculada com base na avaliação de cada critério usando escala de 0 a 5 (e pontuação global de 0 a 100).'
    },
    {
      item: '5.2.2',
      titulo: 'Média dos Avaliadores',
      texto: 'A pontuação total de cada dissertação será obtida pela média das pontuações atribuídas pelos avaliadores externos.'
    },
    {
      item: '5.2.3.1',
      titulo: 'Primeiro Critério de Desempate',
      texto: 'Em caso de empate na classificação, terá preferência a dissertação cujo autor tenha concluído o curso em menor tempo, contado em dias entre a primeira matrícula como discente regular no PPG/GIT e a defesa.'
    },
    {
      item: '5.2.3.2',
      titulo: 'Critérios Sucessivos de Desempate',
      texto: 'Persistindo o empate, serão consideradas, sucessivamente, as maiores médias nos critérios: 1) qualidade e rigor metodológico; 2) originalidade e contribuição; 3) relevância e impacto social; 4) fundamentação teórica; 5) qualidade de escrita e coesão textual. Persistindo empate: sorteio público.'
    }
  ]
};
