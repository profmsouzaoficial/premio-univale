export interface Subcriterio {
  id: string; // e.g. "1.1", "1.2"
  titulo: string;
  afirmacao: string;
}

export interface Criterio {
  id: number; // 1 to 5
  numero: string;
  nome: string;
  descricao: string;
  subcriterios: Subcriterio[];
}

export interface Dissertacao {
  id: string;
  autor: string;
  titulo: string;
  ano: number;
  laboratorio: string;
  paginas?: number;
  linkAcesso: string;
  pdfLocalPath: string; // Caminho para o anexo PDF local
  supabaseStorageUrl?: string; // URL pública no bucket do Supabase Storage
  citacaoCompleta: string;
  resumoBreve?: string;
  tempoConclusaoDias?: number; // Para critério de desempate (Artigo 5.2.3.1)
  dataDefesa?: string;
}

export interface Avaliador {
  id: string;
  nome: string;
  titulacao: string; // e.g., "Dr.", "Dra.", "PhD"
  instituicao: string; // IES
  papel: 'presidente' | 'avaliador';
  email: string;
  telefone?: string;
  senhaAcesso: string;
}

export interface AvaliacaoDissertacao {
  dissertacaoId: string;
  avaliadorId: string;
  // Respostas Likert: map de subcriterioId -> nota (1 a 5)
  likertRespostas: Record<string, number>;
  // Somas e médias por critério (cada critério tem 3 itens = soma de 3 a 15, média 1 a 5)
  somasCriterios: Record<number, number>;
  mediasCriterios: Record<number, number>;
  // Somatório total da escala Likert (15 itens x 1 a 5 = 15 a 75 pontos)
  somatorioLikert75: number;
  // Nota livre atribuída pelo professor (0 a 25 pontos)
  notaLivre25: number;
  // Nota Final do Avaliador (Somatório Likert + Nota Livre = até 100 pontos)
  notaFinal100: number;
  // Parecer e considerações gerais
  comentariosGerais: string;
  pontosFortes?: string;
  oportunidadesMelhoria?: string;
  // Indicação de menção honrosa
  indicacaoMencaoHonrosa: boolean;
  justificativaMencaoHonrosa?: string;
  // Metadados
  atualizadoEm: string;
  concluida: boolean;
}

export interface RankingItem {
  dissertacao: Dissertacao;
  avaliacoes: Record<string, AvaliacaoDissertacao>; // avaliadorId -> Avaliacao
  notaMediaFinal100: number;
  mediaLikert75: number;
  mediaNotaLivre25: number;
  notaMediaEscala5: number;
  mediasPorCriterio: Record<number, number>;
  votosMencaoHonrosa: number;
  posicao: number;
  criterioDesempateAplicado?: string;
}
