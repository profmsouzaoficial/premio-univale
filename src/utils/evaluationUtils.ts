import { CRITERIOS_AVALIACAO } from '../data/criteriosData';
import { AvaliacaoDissertacao, Avaliador, Dissertacao, RankingItem } from '../types';

export function calculateEvaluationScores(
  likertRespostas: Record<string, number>,
  notaLivre25: number
): {
  somasCriterios: Record<number, number>;
  mediasCriterios: Record<number, number>;
  somatorioLikert75: number;
  notaFinal100: number;
  totalRespondidas: number;
} {
  const somasCriterios: Record<number, number> = {};
  const mediasCriterios: Record<number, number> = {};
  let somatorioLikert75 = 0;
  let totalRespondidas = 0;

  CRITERIOS_AVALIACAO.forEach((criterio) => {
    let somaSub = 0;
    let countSub = 0;

    criterio.subcriterios.forEach((sub) => {
      const val = likertRespostas[sub.id];
      if (typeof val === 'number' && val >= 1 && val <= 5) {
        somaSub += val;
        countSub += 1;
        totalRespondidas += 1;
      }
    });

    somasCriterios[criterio.id] = somaSub;
    mediasCriterios[criterio.id] = countSub > 0 ? parseFloat((somaSub / countSub).toFixed(2)) : 0;
    somatorioLikert75 += somaSub;
  });

  // Nota livre limitada entre 0 e 25
  const notaLivreValidada = Math.max(0, Math.min(25, Number(notaLivre25) || 0));

  // Nota final = Somatório da escala Likert (15 a 75) + Nota livre (0 a 25) = máx 100 pontos
  const notaFinal100 = parseFloat((somatorioLikert75 + notaLivreValidada).toFixed(2));

  return {
    somasCriterios,
    mediasCriterios,
    somatorioLikert75,
    notaFinal100,
    totalRespondidas,
  };
}

export function computeConsolidatedRanking(
  dissertacoes: Dissertacao[],
  avaliadores: Avaliador[],
  avaliacoes: Record<string, Record<string, AvaliacaoDissertacao>> // [dissertacaoId][avaliadorId]
): RankingItem[] {
  const ranking: RankingItem[] = dissertacoes.map((diss) => {
    const dissAvaliacoes = avaliacoes[diss.id] || {};
    const avaliacoesList = Object.values(dissAvaliacoes);

    let somaNotas100 = 0;
    let somaSomaLikert = 0;
    let somaNotaLivre = 0;
    let totalAvaliadoresComNota = 0;
    let votosMencao = 0;

    const somaCriterios: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const contagemCriterios: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    avaliacoesList.forEach((av) => {
      if (av && av.concluida) {
        somaNotas100 += av.notaFinal100;
        somaSomaLikert += av.somatorioLikert75;
        somaNotaLivre += av.notaLivre25;
        totalAvaliadoresComNota += 1;

        if (av.indicacaoMencaoHonrosa) {
          votosMencao += 1;
        }

        if (av.mediasCriterios) {
          [1, 2, 3, 4, 5].forEach((cId) => {
            if (av.mediasCriterios[cId]) {
              somaCriterios[cId] += av.mediasCriterios[cId];
              contagemCriterios[cId] += 1;
            }
          });
        }
      }
    });

    const notaMediaFinal100 = totalAvaliadoresComNota > 0
      ? parseFloat((somaNotas100 / totalAvaliadoresComNota).toFixed(2))
      : 0;

    const mediaLikert75 = totalAvaliadoresComNota > 0
      ? parseFloat((somaSomaLikert / totalAvaliadoresComNota).toFixed(2))
      : 0;

    const mediaNotaLivre25 = totalAvaliadoresComNota > 0
      ? parseFloat((somaNotaLivre / totalAvaliadoresComNota).toFixed(2))
      : 0;

    const notaMediaEscala5 = parseFloat(((notaMediaFinal100 / 100) * 5).toFixed(2));

    const mediasPorCriterio: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    [1, 2, 3, 4, 5].forEach((cId) => {
      mediasPorCriterio[cId] = contagemCriterios[cId] > 0
        ? parseFloat((somaCriterios[cId] / contagemCriterios[cId]).toFixed(2))
        : 0;
    });

    return {
      dissertacao: diss,
      avaliacoes: dissAvaliacoes,
      notaMediaFinal100,
      mediaLikert75,
      mediaNotaLivre25,
      notaMediaEscala5,
      mediasPorCriterio,
      votosMencaoHonrosa: votosMencao,
      posicao: 0,
    };
  });

  // Ordenação com aplicação estrita do Edital
  ranking.sort((a, b) => {
    // 1. Diferença de nota média final (0 a 100)
    if (Math.abs(b.notaMediaFinal100 - a.notaMediaFinal100) >= 0.01) {
      return b.notaMediaFinal100 - a.notaMediaFinal100;
    }

    // Em caso de empate:
    // Art. 5.2.3.1 - menor tempo de conclusão em dias
    const tempoA = a.dissertacao.tempoConclusaoDias ?? 9999;
    const tempoB = b.dissertacao.tempoConclusaoDias ?? 9999;
    if (tempoA !== tempoB) {
      a.criterioDesempateAplicado = `Art. 5.2.3.1: Menor tempo de conclusão (${tempoA} dias vs ${tempoB} dias)`;
      b.criterioDesempateAplicado = `Art. 5.2.3.1: Menor tempo de conclusão (${tempoA} dias vs ${tempoB} dias)`;
      return tempoA - tempoB;
    }

    // Art. 5.2.3.2 - Sucessivamente:
    // 1) rigor metodológico (id: 3)
    const m3Diff = b.mediasPorCriterio[3] - a.mediasPorCriterio[3];
    if (Math.abs(m3Diff) >= 0.01) {
      const msg = `Art. 5.2.3.2: Maior média em Rigor Metodológico (${b.mediasPorCriterio[3].toFixed(2)} vs ${a.mediasPorCriterio[3].toFixed(2)})`;
      a.criterioDesempateAplicado = msg;
      b.criterioDesempateAplicado = msg;
      return m3Diff;
    }

    // 2) originalidade e contribuição (id: 2)
    const m2Diff = b.mediasPorCriterio[2] - a.mediasPorCriterio[2];
    if (Math.abs(m2Diff) >= 0.01) {
      const msg = `Art. 5.2.3.2: Maior média em Originalidade (${b.mediasPorCriterio[2].toFixed(2)} vs ${a.mediasPorCriterio[2].toFixed(2)})`;
      a.criterioDesempateAplicado = msg;
      b.criterioDesempateAplicado = msg;
      return m2Diff;
    }

    // 3) relevância e impacto social (id: 4)
    const m4Diff = b.mediasPorCriterio[4] - a.mediasPorCriterio[4];
    if (Math.abs(m4Diff) >= 0.01) {
      const msg = `Art. 5.2.3.2: Maior média em Impacto Social (${b.mediasPorCriterio[4].toFixed(2)} vs ${a.mediasPorCriterio[4].toFixed(2)})`;
      a.criterioDesempateAplicado = msg;
      b.criterioDesempateAplicado = msg;
      return m4Diff;
    }

    // 4) fundamentação teórica (id: 5)
    const m5Diff = b.mediasPorCriterio[5] - a.mediasPorCriterio[5];
    if (Math.abs(m5Diff) >= 0.01) {
      const msg = `Art. 5.2.3.2: Maior média em Fundamentação Teórica (${b.mediasPorCriterio[5].toFixed(2)} vs ${a.mediasPorCriterio[5].toFixed(2)})`;
      a.criterioDesempateAplicado = msg;
      b.criterioDesempateAplicado = msg;
      return m5Diff;
    }

    // 5) qualidade de escrita (id: 1)
    const m1Diff = b.mediasPorCriterio[1] - a.mediasPorCriterio[1];
    if (Math.abs(m1Diff) >= 0.01) {
      const msg = `Art. 5.2.3.2: Maior média em Qualidade de Escrita (${b.mediasPorCriterio[1].toFixed(2)} vs ${a.mediasPorCriterio[1].toFixed(2)})`;
      a.criterioDesempateAplicado = msg;
      b.criterioDesempateAplicado = msg;
      return m1Diff;
    }

    return 0;
  });

  // Atribui posições
  ranking.forEach((item, index) => {
    item.posicao = index + 1;
  });

  return ranking;
}

// Cria avaliações de exemplo consistentes com a regra 15-75 Likert + 0-25 Nota Livre
export const SAMPLE_EVALUATIONS: Record<string, Record<string, AvaliacaoDissertacao>> = {
  'santana-girley': {
    'marcio-souza': {
      dissertacaoId: 'santana-girley',
      avaliadorId: 'marcio-souza',
      likertRespostas: {
        '1.1': 5, '1.2': 5, '1.3': 5,
        '2.1': 5, '2.2': 5, '2.3': 5,
        '3.1': 5, '3.2': 5, '3.3': 5,
        '4.1': 5, '4.2': 5, '4.3': 5,
        '5.1': 5, '5.2': 5, '5.3': 5,
      },
      somasCriterios: { 1: 15, 2: 15, 3: 15, 4: 15, 5: 15 },
      mediasCriterios: { 1: 5.0, 2: 5.0, 3: 5.0, 4: 5.0, 5: 5.0 },
      somatorioLikert75: 75,
      notaLivre25: 24.5,
      notaFinal100: 99.5,
      comentariosGerais: 'Trabalho de excepcional maturidade epistemológica e sensibilidade metodológica. A abordagem autoetnográfica dos Krenak traz contribuição ímpar para o campo da Gestão Integrada do Território.',
      pontosFortes: 'Originalidade ontológica e metodológica rara, relevância social urgente para a bacia do Rio Doce.',
      oportunidadesMelhoria: 'Potencial imediato para publicação como livro pela UNIVALE Editora e artigos científicos.',
      indicacaoMencaoHonrosa: true,
      justificativaMencaoHonrosa: 'Trabalho paradigmático de descolonização do saber.',
      atualizadoEm: '2026-10-25T14:30:00Z',
      concluida: true,
    },
    'andrey-souza': {
      dissertacaoId: 'santana-girley',
      avaliadorId: 'andrey-souza',
      likertRespostas: {
        '1.1': 5, '1.2': 5, '1.3': 5,
        '2.1': 5, '2.2': 5, '2.3': 4,
        '3.1': 5, '3.2': 4, '3.3': 5,
        '4.1': 5, '4.2': 5, '4.3': 5,
        '5.1': 5, '5.2': 5, '5.3': 5,
      },
      somasCriterios: { 1: 15, 2: 14, 3: 14, 4: 15, 5: 15 },
      mediasCriterios: { 1: 5.0, 2: 4.67, 3: 4.67, 4: 5.0, 5: 5.0 },
      somatorioLikert75: 73,
      notaLivre25: 24.0,
      notaFinal100: 97.0,
      comentariosGerais: 'Pesquisa autoetnográfica vigorosa, com densidade teórica e imensa coragem acadêmica. Representa o que há de mais avançado em reflexão territorial decolonial.',
      indicacaoMencaoHonrosa: true,
      atualizadoEm: '2026-10-26T10:15:00Z',
      concluida: true,
    },
    'carlos-dias': {
      dissertacaoId: 'santana-girley',
      avaliadorId: 'carlos-dias',
      likertRespostas: {
        '1.1': 5, '1.2': 4, '1.3': 5,
        '2.1': 5, '2.2': 5, '2.3': 5,
        '3.1': 5, '3.2': 4, '3.3': 4,
        '4.1': 5, '4.2': 5, '4.3': 5,
        '5.1': 5, '5.2': 5, '5.3': 5,
      },
      somasCriterios: { 1: 14, 2: 15, 3: 13, 4: 15, 5: 15 },
      mediasCriterios: { 1: 4.67, 2: 5.0, 3: 4.33, 4: 5.0, 5: 5.0 },
      somatorioLikert75: 72,
      notaLivre25: 24.0,
      notaFinal100: 96.0,
      comentariosGerais: 'Obra de altíssimo impacto social e rigor conceitual. Cumpre com louvor todos os quesitos avaliativos do Edital.',
      indicacaoMencaoHonrosa: true,
      atualizadoEm: '2026-10-26T16:00:00Z',
      concluida: true,
    },
  },
  'santos-guilherme': {
    'marcio-souza': {
      dissertacaoId: 'santos-guilherme',
      avaliadorId: 'marcio-souza',
      likertRespostas: {
        '1.1': 5, '1.2': 5, '1.3': 4,
        '2.1': 5, '2.2': 5, '2.3': 4,
        '3.1': 5, '3.2': 4, '3.3': 4,
        '4.1': 5, '4.2': 5, '4.3': 5,
        '5.1': 4, '5.2': 5, '5.3': 4,
      },
      somasCriterios: { 1: 14, 2: 14, 3: 13, 4: 15, 5: 13 },
      mediasCriterios: { 1: 4.67, 2: 4.67, 3: 4.33, 4: 5.0, 5: 4.33 },
      somatorioLikert75: 69,
      notaLivre25: 23.5,
      notaFinal100: 92.5,
      comentariosGerais: 'Trabalho contundente e necessário. A categoria de corpos-territórios é trabalhada com perspicácia empírica no bairro Turmalina.',
      pontosFortes: 'Riqueza do material etnográfico e escuta sensível da juventude negra local.',
      indicacaoMencaoHonrosa: true,
      justificativaMencaoHonrosa: 'Forte recomendação para menção honrosa pelo impacto comunitário e rigor discursivo.',
      atualizadoEm: '2026-10-25T17:20:00Z',
      concluida: true,
    },
    'andrey-souza': {
      dissertacaoId: 'santos-guilherme',
      avaliadorId: 'andrey-souza',
      likertRespostas: {
        '1.1': 4, '1.2': 5, '1.3': 5,
        '2.1': 5, '2.2': 4, '2.3': 5,
        '3.1': 4, '3.2': 4, '3.3': 5,
        '4.1': 5, '4.2': 5, '4.3': 5,
        '5.1': 5, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 14, 2: 14, 3: 13, 4: 15, 5: 13 },
      mediasCriterios: { 1: 4.67, 2: 4.67, 3: 4.33, 4: 5.0, 5: 4.33 },
      somatorioLikert75: 69,
      notaLivre25: 23.0,
      notaFinal100: 92.0,
      comentariosGerais: 'Excelente dissertação com alta relevância social e sólida base empírica em Governador Valadares.',
      indicacaoMencaoHonrosa: true,
      atualizadoEm: '2026-10-26T11:45:00Z',
      concluida: true,
    },
    'carlos-dias': {
      dissertacaoId: 'santos-guilherme',
      avaliadorId: 'carlos-dias',
      likertRespostas: {
        '1.1': 5, '1.2': 4, '1.3': 4,
        '2.1': 5, '2.2': 5, '2.3': 4,
        '3.1': 4, '3.2': 4, '3.3': 4,
        '4.1': 5, '4.2': 5, '4.3': 5,
        '5.1': 4, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 13, 2: 14, 3: 12, 4: 15, 5: 12 },
      mediasCriterios: { 1: 4.33, 2: 4.67, 3: 4.0, 4: 5.0, 5: 4.0 },
      somatorioLikert75: 66,
      notaLivre25: 23.0,
      notaFinal100: 89.0,
      comentariosGerais: 'Pesquisa com expressivo compromisso social e densidade das narrativas orais.',
      indicacaoMencaoHonrosa: true,
      atualizadoEm: '2026-10-26T16:30:00Z',
      concluida: true,
    },
  },
  'silva-henrique': {
    'marcio-souza': {
      dissertacaoId: 'silva-henrique',
      avaliadorId: 'marcio-souza',
      likertRespostas: {
        '1.1': 5, '1.2': 4, '1.3': 4,
        '2.1': 4, '2.2': 4, '2.3': 4,
        '3.1': 5, '3.2': 5, '3.3': 4,
        '4.1': 5, '4.2': 4, '4.3': 4,
        '5.1': 4, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 13, 2: 12, 3: 14, 4: 13, 5: 12 },
      mediasCriterios: { 1: 4.33, 2: 4.0, 3: 4.67, 4: 4.33, 5: 4.0 },
      somatorioLikert75: 64,
      notaLivre25: 21.0,
      notaFinal100: 85.0,
      comentariosGerais: 'Abordagem muito competente e responsável de um tema delicado no cotidiano da Atenção Básica em Saúde.',
      indicacaoMencaoHonrosa: false,
      atualizadoEm: '2026-10-25T18:00:00Z',
      concluida: true,
    },
    'andrey-souza': {
      dissertacaoId: 'silva-henrique',
      avaliadorId: 'andrey-souza',
      likertRespostas: {
        '1.1': 4, '1.2': 4, '1.3': 4,
        '2.1': 4, '2.2': 4, '2.3': 4,
        '3.1': 4, '3.2': 4, '3.3': 4,
        '4.1': 5, '4.2': 4, '4.3': 4,
        '5.1': 4, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 12, 2: 12, 3: 12, 4: 13, 5: 12 },
      mediasCriterios: { 1: 4.0, 2: 4.0, 3: 4.0, 4: 4.33, 5: 4.0 },
      somatorioLikert75: 61,
      notaLivre25: 21.0,
      notaFinal100: 82.0,
      comentariosGerais: 'Trabalho consistente com contribuição relevante para a gestão do SUS local.',
      indicacaoMencaoHonrosa: false,
      atualizadoEm: '2026-10-26T12:00:00Z',
      concluida: true,
    },
    'carlos-dias': {
      dissertacaoId: 'silva-henrique',
      avaliadorId: 'carlos-dias',
      likertRespostas: {
        '1.1': 4, '1.2': 5, '1.3': 4,
        '2.1': 4, '2.2': 4, '2.3': 4,
        '3.1': 5, '3.2': 4, '3.3': 4,
        '4.1': 4, '4.2': 4, '4.3': 4,
        '5.1': 4, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 13, 2: 12, 3: 13, 4: 12, 5: 12 },
      mediasCriterios: { 1: 4.33, 2: 4.0, 3: 4.33, 4: 4.0, 5: 4.0 },
      somatorioLikert75: 62,
      notaLivre25: 21.0,
      notaFinal100: 83.0,
      comentariosGerais: 'Boa dissertação, clara, bem estruturada e com metodologia bem executada.',
      indicacaoMencaoHonrosa: false,
      atualizadoEm: '2026-10-26T17:00:00Z',
      concluida: true,
    },
  },
  'martins-luciana': {
    'marcio-souza': {
      dissertacaoId: 'martins-luciana',
      avaliadorId: 'marcio-souza',
      likertRespostas: {
        '1.1': 5, '1.2': 4, '1.3': 5,
        '2.1': 5, '2.2': 4, '2.3': 4,
        '3.1': 4, '3.2': 4, '3.3': 4,
        '4.1': 4, '4.2': 4, '4.3': 4,
        '5.1': 5, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 14, 2: 13, 3: 12, 4: 12, 5: 13 },
      mediasCriterios: { 1: 4.67, 2: 4.33, 3: 4.0, 4: 4.0, 5: 4.33 },
      somatorioLikert75: 64,
      notaLivre25: 22.0,
      notaFinal100: 86.0,
      comentariosGerais: 'Discussão inovadora sobre território virtual e herança de ativos intangíveis na era das plataformas digitais.',
      indicacaoMencaoHonrosa: false,
      atualizadoEm: '2026-10-25T18:40:00Z',
      concluida: true,
    },
    'andrey-souza': {
      dissertacaoId: 'martins-luciana',
      avaliadorId: 'andrey-souza',
      likertRespostas: {
        '1.1': 4, '1.2': 4, '1.3': 4,
        '2.1': 5, '2.2': 4, '2.3': 4,
        '3.1': 4, '3.2': 4, '3.3': 4,
        '4.1': 4, '4.2': 4, '4.3': 4,
        '5.1': 4, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 12, 2: 13, 3: 12, 4: 12, 5: 12 },
      mediasCriterios: { 1: 4.0, 2: 4.33, 3: 4.0, 4: 4.0, 5: 4.0 },
      somatorioLikert75: 61,
      notaLivre25: 21.0,
      notaFinal100: 82.0,
      comentariosGerais: 'Texto bem escrito, objetivo e com perspectiva interdisciplinar promissora.',
      indicacaoMencaoHonrosa: false,
      atualizadoEm: '2026-10-26T13:10:00Z',
      concluida: true,
    },
    'carlos-dias': {
      dissertacaoId: 'martins-luciana',
      avaliadorId: 'carlos-dias',
      likertRespostas: {
        '1.1': 5, '1.2': 4, '1.3': 4,
        '2.1': 4, '2.2': 4, '2.3': 4,
        '3.1': 4, '3.2': 4, '3.3': 4,
        '4.1': 4, '4.2': 4, '4.3': 4,
        '5.1': 4, '5.2': 4, '5.3': 4,
      },
      somasCriterios: { 1: 13, 2: 12, 3: 12, 4: 12, 5: 12 },
      mediasCriterios: { 1: 4.33, 2: 4.0, 3: 4.0, 4: 4.0, 5: 4.0 },
      somatorioLikert75: 61,
      notaLivre25: 21.0,
      notaFinal100: 82.0,
      comentariosGerais: 'Trabalho de boa qualidade formal com conceitos jurídicos bem fundamentados.',
      indicacaoMencaoHonrosa: false,
      atualizadoEm: '2026-10-26T17:40:00Z',
      concluida: true,
    },
  },
};
