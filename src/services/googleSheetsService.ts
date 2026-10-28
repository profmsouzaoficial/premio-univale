import { AvaliacaoDissertacao, Avaliador, Dissertacao, RankingItem } from '../types';
import { computeConsolidatedRanking } from '../utils/evaluationUtils';

export interface SheetsExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
  updatedAt: string;
}

export async function exportToGoogleSheets(
  accessToken: string,
  dissertacoes: Dissertacao[],
  avaliadores: Avaliador[],
  avaliacoes: Record<string, Record<string, AvaliacaoDissertacao>>,
  existingSpreadsheetId?: string
): Promise<SheetsExportResult> {
  const ranking = computeConsolidatedRanking(dissertacoes, avaliadores, avaliacoes);
  const dataHoje = new Date().toLocaleDateString('pt-BR');

  let spreadsheetId = existingSpreadsheetId;
  let spreadsheetUrl = '';
  const title = `Prêmio Melhor Dissertação PPG-GIT 2025 - UNIVALE (${dataHoje})`;

  // 1. Cria a planilha caso não exista
  if (!spreadsheetId) {
    const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          title,
        },
        sheets: [
          { properties: { title: 'Quadro Consolidado' } },
          { properties: { title: 'Notas Detalhadas por Avaliador' } },
        ],
      }),
    });

    if (!createRes.ok) {
      const errData = await createRes.json();
      throw new Error(errData.error?.message || 'Falha ao criar planilha no Google Sheets');
    }

    const created = await createRes.json();
    spreadsheetId = created.spreadsheetId;
    spreadsheetUrl = created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  } else {
    spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
  }

  // 2. Prepara os dados da aba "Quadro Consolidado"
  const consolidadoRows: (string | number)[][] = [
    ['UNIVERSIDADE VALE DO RIO DOCE - UNIVALE'],
    ['PROGRAMA DE PÓS-GRADUAÇÃO EM GESTÃO INTEGRADA DO TERRITÓRIO (PPG/GIT)'],
    [`PRÊMIO DE MELHOR DISSERTAÇÃO DE 2025 - EDITAL Nº 115/2026 - Exportado em: ${new Date().toLocaleString('pt-BR')}`],
    ['Regra de Pontuação: Escala Likert (15 a 75 pontos) + Nota Livre (0 a 25 pontos) = Total de até 100 pontos'],
    [],
    [
      'Classificação',
      'Autor(a)',
      'Título da Dissertação',
      'Laboratório',
      'Média Likert (/75)',
      'Média Livre (/25)',
      'Média Final (/100)',
      'Escala Edital (/5.00)',
      'Votos Menção Honrosa',
      'Desempate / Status',
    ],
  ];

  ranking.forEach((item) => {
    let statusPremio = `${item.posicao}º Lugar`;
    if (item.posicao === 1) statusPremio = '1º Lugar (Vencedora do Prêmio)';
    else if (item.posicao === 2 && item.votosMencaoHonrosa >= 2) statusPremio = '2º Lugar (Menção Honrosa)';

    consolidadoRows.push([
      `${item.posicao}º Lugar`,
      item.dissertacao.autor,
      item.dissertacao.titulo,
      item.dissertacao.laboratorio,
      item.mediaLikert75.toFixed(2),
      item.mediaNotaLivre25.toFixed(2),
      item.notaMediaFinal100.toFixed(2),
      item.notaMediaEscala5.toFixed(2),
      `${item.votosMencaoHonrosa} de ${avaliadores.length}`,
      item.criterioDesempateAplicado || statusPremio,
    ]);
  });

  // 3. Prepara os dados da aba "Notas Detalhadas por Avaliador"
  const detalhadasRows: (string | number)[][] = [
    [
      'Avaliador(a)',
      'Papel',
      'Dissertação',
      'Autor(a)',
      '1.1 Escrita', '1.2 Lógica', '1.3 Maturidade', 'Sub C1 (15)',
      '2.1 Ineditismo', '2.2 Lacuna', '2.3 Conhec.', 'Sub C2 (15)',
      '3.1 Desenho', '3.2 Transparência', '3.3 Consistência', 'Sub C3 (15)',
      '4.1 Demandas', '4.2 Aplicabilidade', '4.3 Impacto', 'Sub C4 (15)',
      '5.1 Abrangência', '5.2 Diálogo', '5.3 Sustentação', 'Sub C5 (15)',
      'Total Likert (/75)',
      'Nota Livre (/25)',
      'Nota Final (/100)',
      'Menção Honrosa',
      'Parecer Descritivo / Comentários Gerais',
    ],
  ];

  avaliadores.forEach((av) => {
    dissertacoes.forEach((diss) => {
      const avaliacao = avaliacoes[diss.id]?.[av.id];
      if (avaliacao && avaliacao.concluida) {
        const r = avaliacao.likertRespostas || {};
        detalhadasRows.push([
          av.nome,
          av.papel === 'presidente' ? 'Presidente' : 'Membro Avaliador',
          diss.titulo,
          diss.autor,
          r['1.1'] ?? '—', r['1.2'] ?? '—', r['1.3'] ?? '—', avaliacao.somasCriterios?.[1] ?? '—',
          r['2.1'] ?? '—', r['2.2'] ?? '—', r['2.3'] ?? '—', avaliacao.somasCriterios?.[2] ?? '—',
          r['3.1'] ?? '—', r['3.2'] ?? '—', r['3.3'] ?? '—', avaliacao.somasCriterios?.[3] ?? '—',
          r['4.1'] ?? '—', r['4.2'] ?? '—', r['4.3'] ?? '—', avaliacao.somasCriterios?.[4] ?? '—',
          r['5.1'] ?? '—', r['5.2'] ?? '—', r['5.3'] ?? '—', avaliacao.somasCriterios?.[5] ?? '—',
          avaliacao.somatorioLikert75,
          avaliacao.notaLivre25,
          avaliacao.notaFinal100,
          avaliacao.indicacaoMencaoHonrosa ? 'Sim' : 'Não',
          avaliacao.comentariosGerais || '',
        ]);
      }
    });
  });

  // 4. Grava os valores via Sheets API batchUpdate
  const updateRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Quadro Consolidado!A1',
            values: consolidadoRows,
          },
          {
            range: 'Notas Detalhadas por Avaliador!A1',
            values: detalhadasRows,
          },
        ],
      }),
    }
  );

  if (!updateRes.ok) {
    const errData = await updateRes.json();
    throw new Error(errData.error?.message || 'Erro ao sincronizar dados na planilha');
  }

  return {
    spreadsheetId: spreadsheetId!,
    spreadsheetUrl,
    title,
    updatedAt: new Date().toISOString(),
  };
}
