import { AvaliacaoDissertacao, Avaliador, Dissertacao, RankingItem } from '../types';
import { computeConsolidatedRanking } from '../utils/evaluationUtils';

export interface DocsExportResult {
  documentId: string;
  documentUrl: string;
  title: string;
  createdAt: string;
}

export async function generateAtaGoogleDoc(
  accessToken: string,
  dissertacoes: Dissertacao[],
  avaliadores: Avaliador[],
  avaliacoes: Record<string, Record<string, AvaliacaoDissertacao>>
): Promise<DocsExportResult> {
  const ranking = computeConsolidatedRanking(dissertacoes, avaliadores, avaliacoes);
  const presidente = avaliadores.find((a) => a.papel === 'presidente') || avaliadores[0];
  const outrosMembros = avaliadores.filter((a) => a.id !== presidente.id);
  const primeiroLugar = ranking[0];
  const segundoLugar = ranking[1];

  const dataHojeExtenso = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const title = `Ata de Deliberação - Prêmio Melhor Dissertação PPG/GIT 2025 - UNIVALE`;

  // 1. Cria o documento no Google Docs
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title,
    }),
  });

  if (!createRes.ok) {
    const errData = await createRes.json();
    throw new Error(errData.error?.message || 'Falha ao criar documento no Google Docs');
  }

  const createdDoc = await createRes.json();
  const documentId = createdDoc.documentId;
  const documentUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  // 2. Prepara o texto integral da Ata
  let textoAta = `UNIVERSIDADE VALE DO RIO DOCE - UNIVALE\n`;
  textoAta += `FUNDAÇÃO PERCIVAL FARQUHAR - ENTIDADE MANTENEDORA (CNPJ 20.611.810/0001-91)\n`;
  textoAta += `PROGRAMA DE PÓS-GRADUAÇÃO STRICTO SENSU EM GESTÃO INTEGRADA DO TERRITÓRIO (PPG/GIT)\n\n`;
  textoAta += `ATA DE DELIBERAÇÃO FINAL DA COMISSÃO DE AVALIAÇÃO\n`;
  textoAta += `PRÊMIO DE MELHOR DISSERTAÇÃO DO PPG/GIT DE 2025 · EDITAL UNIVALE Nº 115/2026\n\n`;

  textoAta += `Aos dezenove dias do mês de novembro do ano de dois mil e vinte e seis, reuniu-se a Comissão de Avaliação do Prêmio de Melhor Dissertação do PPG/GIT de 2025, constituída nos termos do Edital UNIVALE Nº 115/2026, composta pelos professores avaliadores: ${presidente.nome} (${presidente.instituicao}), no exercício da Presidência da Comissão; ${outrosMembros.map((m) => `${m.nome} (${m.instituicao})`).join('; ')}.\n\n`;

  textoAta += `Instalada a sessão de deliberação, a Comissão procedeu à análise e consolidação das pontuações conferidas às dissertações defendidas no ano de 2025 e indicadas pelos quatro laboratórios do Programa (NEDER, SAIS, NIESD e OBIT). A sistemática de avaliação atendeu ao desdobramento dos critérios do Edital em 15 afirmações Likert (somatório de 15 a 75 pontos) e Nota Livre Docente (0 a 25 pontos), totalizando pontuação final na escala centesimal de até 100 pontos, calculada pela média aritmética das notas dos avaliadores.\n\n`;

  textoAta += `1. CLASSIFICAÇÃO FINAL HOMOLOGADA:\n\n`;
  ranking.forEach((item) => {
    textoAta += `${item.posicao}º LUGAR: ${item.dissertacao.autor.toUpperCase()}\n`;
    textoAta += `   Título: "${item.dissertacao.titulo}"\n`;
    textoAta += `   Laboratório Indicante: ${item.dissertacao.laboratorio}\n`;
    textoAta += `   Média Likert: ${item.mediaLikert75.toFixed(2)}/75 pts | Média Nota Livre: ${item.mediaNotaLivre25.toFixed(2)}/25 pts\n`;
    textoAta += `   PONTUAÇÃO FINAL CONSOLIDADA: ${item.notaMediaFinal100.toFixed(2)} / 100 pontos (Escala Edital: ${item.notaMediaEscala5.toFixed(2)}/5.00)\n`;
    if (item.criterioDesempateAplicado) {
      textoAta += `   Critério de Desempate Aplicado: ${item.criterioDesempateAplicado}\n`;
    }
    textoAta += `   Votos para Menção Honrosa: ${item.votosMencaoHonrosa} indicações\n\n`;
  });

  textoAta += `2. PROCLAMAÇÃO DOS VENCEDORES E MENÇÃO HONROSA:\n\n`;
  if (primeiroLugar) {
    textoAta += `I. PRIMEIRO LUGAR (Vencedora do Prêmio de Melhor Dissertação PPG/GIT 2025): A Comissão declara como vencedora a dissertação "${primeiroLugar.dissertacao.titulo}", de autoria de ${primeiroLugar.dissertacao.autor}, com pontuação média final de ${primeiroLugar.notaMediaFinal100.toFixed(2)} pontos. Farão jus ao certificado de premiação o egresso autor, seu orientador e coorientador, além de oportunidade editorial junto à UNIVALE Editora para a publicação de um e-book, consoante o item 4.1.III do Edital.\n\n`;
  }
  if (segundoLugar) {
    textoAta += `II. ATRIBUIÇÃO DE MENÇÃO HONROSA: Com fundamento nos itens 3.4 e 4.1.II do Edital, a Comissão de Avaliação, considerando o mérito destacado da obra e as indicações favoráveis, concede MENÇÃO HONROSA à dissertação classificada em segundo lugar: "${segundoLugar.dissertacao.titulo}", de autoria de ${segundoLugar.dissertacao.autor}, com média final de ${segundoLugar.notaMediaFinal100.toFixed(2)} pontos.\n\n`;
  }

  textoAta += `Nada mais havendo a constar, lavrou-se a presente ata que segue aprovada e assinada por todos os membros da Comissão de Avaliação para publicação no sítio institucional da UNIVALE e encaminhamento à Coordenação do Programa (territorio@univale.br).\n\n`;
  textoAta += `Governador Valadares/MG, ${dataHojeExtenso}.\n\n`;
  textoAta += `ASSINATURAS DOS MEMBROS DA COMISSÃO DE AVALIAÇÃO:\n\n`;
  textoAta += `_____________________________________________________\n`;
  textoAta += `${presidente.nome} - Presidente da Comissão\n`;
  textoAta += `${presidente.instituicao}\n\n`;

  outrosMembros.forEach((m) => {
    textoAta += `_____________________________________________________\n`;
    textoAta += `${m.nome} - Membro Avaliador\n`;
    textoAta += `${m.instituicao}\n\n`;
  });

  // 3. Insere o conteúdo no documento recém-criado
  const insertRes = await fetch(
    `https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: textoAta,
            },
          },
        ],
      }),
    }
  );

  if (!insertRes.ok) {
    const errData = await insertRes.json();
    throw new Error(errData.error?.message || 'Falha ao preencher texto da Ata no Google Docs');
  }

  return {
    documentId,
    documentUrl,
    title,
    createdAt: new Date().toISOString(),
  };
}
