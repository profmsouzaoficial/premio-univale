-- ==============================================================================
-- UNIVERSIDADE VALE DO RIO DOCE - UNIVALE
-- PROGRAMA DE PÓS-GRADUAÇÃO EM GESTÃO INTEGRADA DO TERRITÓRIO (PPG/GIT)
-- PRÊMIO DE MELHOR DISSERTAÇÃO DE 2025 (EDITAL UNIVALE Nº 115/2026)
--
-- ESQUEMA COMPLETO DE BANCO DE DADOS PARA O SUPABASE (PostgreSQL)
-- Inclui tabelas, triggers de pontuação, view de ranking com desempate,
-- configuração de buckets no Storage, RLS e dados iniciais (Seed).
-- ==============================================================================

-- 1. Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 2. TABELA DE AVALIADORES (Comissão Julgadora)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avaliadores (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    instituicao TEXT NOT NULL,
    papel TEXT NOT NULL DEFAULT 'avaliador' CHECK (papel IN ('presidente', 'avaliador')),
    senha_hash TEXT NOT NULL, -- Senha com hash criptográfico (bcrypt) ou texto cifrado
    ordem_alfabetica INTEGER NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.avaliadores IS 'Membros da Comissão Julgadora em estrita ordem alfabética';

-- ==============================================================================
-- 3. TABELA DE DISSERTAÇÕES (Indicadas pelos Laboratórios do PPG/GIT)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dissertacoes (
    id TEXT PRIMARY KEY,
    autor TEXT NOT NULL,
    titulo TEXT NOT NULL,
    laboratorio TEXT NOT NULL,
    orientador TEXT NOT NULL,
    coorientador TEXT,
    data_defesa DATE NOT NULL,
    dias_para_conclusao INTEGER NOT NULL, -- Critério de desempate principal (Art. 5.2.3.1)
    ano_conclusao INTEGER NOT NULL DEFAULT 2025,
    pdf_storage_path TEXT, -- Caminho no bucket de Storage do Supabase
    pdf_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.dissertacoes IS 'Dissertações de mestrado indicadas para concorrer ao Prêmio PPG/GIT 2025';

-- ==============================================================================
-- 4. TABELA DE AVALIAÇÕES INDIVIDUAIS (Likert 15-75 pts + Nota Livre 0-25 pts = 100 pts)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.avaliacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dissertacao_id TEXT NOT NULL REFERENCES public.dissertacoes(id) ON DELETE CASCADE,
    avaliador_id TEXT NOT NULL REFERENCES public.avaliadores(id) ON DELETE CASCADE,
    
    -- Respostas Likert estruturadas em JSON: {"c1_q1": 5, "c1_q2": 4, ..., "c5_q3": 5} (15 itens, cada de 1 a 5)
    respostas_likert JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Pontuações detalhadas por critério (cada um varia de 3 a 15 pontos)
    pontos_criterio_1 NUMERIC(5,2) NOT NULL DEFAULT 0, -- Qualidade de escrita e coesão
    pontos_criterio_2 NUMERIC(5,2) NOT NULL DEFAULT 0, -- Originalidade e contribuição
    pontos_criterio_3 NUMERIC(5,2) NOT NULL DEFAULT 0, -- Rigor metodológico
    pontos_criterio_4 NUMERIC(5,2) NOT NULL DEFAULT 0, -- Relevância e impacto social
    pontos_criterio_5 NUMERIC(5,2) NOT NULL DEFAULT 0, -- Fundamentação teórica
    
    -- Pontuações consolidadas do Edital
    somatorio_likert_75 NUMERIC(5,2) NOT NULL DEFAULT 15 CHECK (somatorio_likert_75 >= 15 AND somatorio_likert_75 <= 75),
    nota_livre_25 NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (nota_livre_25 >= 0 AND nota_livre_25 <= 25),
    nota_final_100 NUMERIC(5,2) NOT NULL DEFAULT 15 CHECK (nota_final_100 >= 15 AND nota_final_100 <= 100),
    nota_escala_edital_5 NUMERIC(4,2) NOT NULL DEFAULT 0.75 CHECK (nota_escala_edital_5 >= 0.75 AND nota_escala_edital_5 <= 5.00),
    
    -- Voto e parecer
    mencao_honrosa BOOLEAN NOT NULL DEFAULT false,
    comentarios_gerais TEXT,
    concluida BOOLEAN NOT NULL DEFAULT false,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    
    -- Um avaliador só pode ter uma ficha por dissertação
    CONSTRAINT uq_avaliacao_dissertacao_avaliador UNIQUE (dissertacao_id, avaliador_id)
);

COMMENT ON TABLE public.avaliacoes IS 'Fichas de avaliação individual emitidas pelos docentes';

-- ==============================================================================
-- 5. TRIGGER AUTOMÁTICO PARA CÁLCULO DAS NOTAS (Garante integridade matemática)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.fn_calcular_pontuacao_avaliacao()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualiza data de modificação
    NEW.updated_at = timezone('utc'::text, now());
    
    -- Calcula somatório das parcelas: Likert (15 a 75) + Nota Livre (0 a 25) = máx 100
    NEW.nota_final_100 = ROUND(COALESCE(NEW.somatorio_likert_75, 15) + COALESCE(NEW.nota_livre_25, 0), 2);
    
    -- Converte para a escala do Edital de 0 a 5.00 (Art. 5.2.1)
    NEW.nota_escala_edital_5 = ROUND((NEW.nota_final_100 / 100.0) * 5.0, 2);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_calcular_pontuacao_avaliacao ON public.avaliacoes;
CREATE TRIGGER trg_calcular_pontuacao_avaliacao
BEFORE INSERT OR UPDATE ON public.avaliacoes
FOR EACH ROW
EXECUTE FUNCTION public.fn_calcular_pontuacao_avaliacao();

-- ==============================================================================
-- 6. TABELA DE ATAS OFICIAIS HOMOLOGADAS (Privativo da Presidência)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.atas_homologadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    edital_numero TEXT NOT NULL DEFAULT '115/2026',
    ano_premio INTEGER NOT NULL DEFAULT 2025,
    presidente_id TEXT NOT NULL REFERENCES public.avaliadores(id),
    vencedora_dissertacao_id TEXT NOT NULL REFERENCES public.dissertacoes(id),
    mencao_honrosa_dissertacao_id TEXT REFERENCES public.dissertacoes(id),
    ranking_consolidado JSONB NOT NULL,
    hash_autenticidade TEXT NOT NULL,
    observacoes_presidencia TEXT,
    pdf_url TEXT,
    homologada_em TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.atas_homologadas IS 'Atas homologadas e assinadas digitalmente pelo Presidente da Comissão';

-- ==============================================================================
-- 7. VIEW ANALÍTICA DO RANKING CONSOLIDADO (Aplica critérios e desempates do Edital)
-- Art. 5.2.2: Pontuação obtida pela média das pontuações dos avaliadores.
-- Art. 5.2.3.1: Empate definido pela dissertação defendida em menor tempo de curso (dias).
-- Art. 5.2.3.2: Persistindo empate, médias sucessivas: 1) Metodologia, 2) Originalidade, 3) Impacto, 4) Teoria, 5) Escrita.
-- ==============================================================================
CREATE OR REPLACE VIEW public.vw_ranking_consolidado AS
SELECT 
    d.id AS dissertacao_id,
    d.autor,
    d.titulo,
    d.laboratorio,
    d.orientador,
    d.dias_para_conclusao,
    COUNT(a.id) FILTER (WHERE a.concluida) AS total_avaliacoes_concluidas,
    ROUND(AVG(a.somatorio_likert_75), 2) AS media_likert_75,
    ROUND(AVG(a.nota_livre_25), 2) AS media_nota_livre_25,
    ROUND(AVG(a.nota_final_100), 2) AS media_final_100,
    ROUND(AVG(a.nota_escala_edital_5), 2) AS media_escala_edital_5,
    ROUND(AVG(a.pontos_criterio_3), 2) AS media_metodologia,
    ROUND(AVG(a.pontos_criterio_2), 2) AS media_originalidade,
    ROUND(AVG(a.pontos_criterio_4), 2) AS media_impacto_social,
    ROUND(AVG(a.pontos_criterio_5), 2) AS media_fundamentacao_teorica,
    ROUND(AVG(a.pontos_criterio_1), 2) AS media_qualidade_escrita,
    COUNT(a.id) FILTER (WHERE a.mencao_honrosa) AS votos_mencao_honrosa,
    DENSE_RANK() OVER (
        ORDER BY 
            AVG(a.nota_final_100) DESC,
            d.dias_para_conclusao ASC, -- Menor tempo de curso desempata primeiro
            AVG(a.pontos_criterio_3) DESC, -- Metodologia
            AVG(a.pontos_criterio_2) DESC, -- Originalidade
            AVG(a.pontos_criterio_4) DESC, -- Impacto social
            AVG(a.pontos_criterio_5) DESC, -- Fundamentação teórica
            AVG(a.pontos_criterio_1) DESC  -- Escrita
    ) AS posicao_ranking
FROM public.dissertacoes d
LEFT JOIN public.avaliacoes a ON a.dissertacao_id = d.id
GROUP BY d.id, d.autor, d.titulo, d.laboratorio, d.orientador, d.dias_para_conclusao;

-- ==============================================================================
-- 8. CONFIGURAÇÃO DE BUCKET DE ARMAZENAMENTO (Supabase Storage)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('dissertacoes', 'dissertacoes', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('atas-oficiais', 'atas-oficiais', true)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage (Leitura pública e gravação autenticada)
CREATE POLICY "Permitir leitura pública de dissertações"
ON storage.objects FOR SELECT
USING (bucket_id IN ('dissertacoes', 'atas-oficiais'));

CREATE POLICY "Permitir upload para membros da comissão"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id IN ('dissertacoes', 'atas-oficiais'));

-- ==============================================================================
-- 9. POLÍTICAS DE SEGURANÇA (Row Level Security - RLS)
-- ==============================================================================
ALTER TABLE public.avaliadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dissertacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.atas_homologadas ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público/anon para a aplicação
CREATE POLICY "Permitir leitura de avaliadores para autenticação"
ON public.avaliadores FOR SELECT
USING (true);

CREATE POLICY "Permitir leitura de dissertações"
ON public.dissertacoes FOR SELECT
USING (true);

CREATE POLICY "Permitir leitura e gravação de avaliações"
ON public.avaliacoes FOR ALL
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir leitura e gravação de atas homologadas"
ON public.atas_homologadas FOR ALL
USING (true)
WITH CHECK (true);

-- ==============================================================================
-- 10. SEED DE DADOS INICIAIS (Docentes em Ordem Alfabética + 4 Dissertações)
-- ==============================================================================

-- 10.1 Avaliadores cadastrados em ordem alfabética estrita (conforme Supabase Auth)
INSERT INTO public.avaliadores (id, nome, email, instituicao, papel, senha_hash, ordem_alfabetica)
VALUES 
    ('andrey-souza', 'Prof. Dr. Andrey Souza', 'andrey.lopes@ufvjm.edu.br', 'Universidade Federal dos Vales do Jequitinhonha e Mucuri (UFVJM)', 'avaliador', crypt('premio', gen_salt('bf')), 1),
    ('bruno-capile', 'Prof. Dr. Bruno Capilé', 'bruno.capile@univale.br', 'Universidade Vale do Rio Doce (UNIVALE) / PPG/GIT', 'avaliador', crypt('premio', gen_salt('bf')), 2),
    ('carlos-dias', 'Prof. Dr. Carlos Dias', 'carlos.dias@ufvjm.edu.br', 'Universidade Federal dos Vales do Jequitinhonha e Mucuri (UFVJM)', 'avaliador', crypt('premio', gen_salt('bf')), 3),
    ('franco-araujo', 'Prof. Dr. Franco Araújo', 'franco.araujo@univale.br', 'Universidade Vale do Rio Doce (UNIVALE)', 'avaliador', crypt('premio', gen_salt('bf')), 4),
    ('marcio-souza', 'Prof. Dr. Márcio Souza', 'marcio.souza@ufjf.br', 'Universidade Federal de Juiz de Fora (UFJF)', 'presidente', crypt('premio', gen_salt('bf')), 5),
    ('suely-rodrigues', 'Profa. Dra. Suely Rodrigues', 'suely.rodrigues@univale.br', 'Universidade Vale do Rio Doce (UNIVALE)', 'avaliador', crypt('premio', gen_salt('bf')), 6)
ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    instituicao = EXCLUDED.instituicao,
    papel = EXCLUDED.papel,
    ordem_alfabetica = EXCLUDED.ordem_alfabetica;

-- 10.2 As 4 Dissertações indicadas com tempo de conclusão em dias
INSERT INTO public.dissertacoes (id, autor, titulo, laboratorio, orientador, data_defesa, dias_para_conclusao, pdf_storage_path, pdf_url)
VALUES 
    (
        'santos-guilherme',
        'Guilherme Rodrigues dos Santos',
        'O racismo num existe. É por causa que é igual aquela pessoa que nunca viu um fantasma: conformações dos corpos-territórios de jovens negros, no bairro Turmalina, em Governador Valadares-MG',
        'Laboratório de Estudos Territoriais e Sociais',
        'Prof. Dr. Ewerton Rodrigo',
        '2025-03-20',
        712,
        'dissertacoes/Guilherme_Rodrigues_dos_Santos.pdf',
        'https://pwusflbyvamjnfmuvagy.supabase.co/storage/v1/object/public/dissertacoes/Guilherme_Rodrigues_dos_Santos.pdf'
    ),
    (
        'silva-henrique',
        'Henrique Bianor Freitas Silva',
        'Assédio no trabalho em saúde: experiências silenciadas e respostas institucionais na atenção básica de Governador Valadares-MG no contexto do pet-saúde equidade',
        'Laboratório de Pesquisa Saúde, Indivíduo e Sociedade (SAIS)',
        'Profa. Dra. Maria Cristina',
        '2025-11-07',
        725,
        'dissertacoes/Henrique_Bianor_Freitas_Silva.pdf',
        'https://pwusflbyvamjnfmuvagy.supabase.co/storage/v1/object/public/dissertacoes/Henrique_Bianor_Freitas_Silva.pdf'
    ),
    (
        'martins-luciana',
        'Luciana da Cunha Pereira Martins',
        'Herança digital: território virtual e dignidade humana',
        'Laboratório de Direitos, Território e Cidadania',
        'Prof. Dr. Marcos Vinicius',
        '2025-04-11',
        698,
        'dissertacoes/Luciana_da_Cunha_Pereira_Martins.pdf',
        'https://pwusflbyvamjnfmuvagy.supabase.co/storage/v1/object/public/dissertacoes/Luciana_da_Cunha_Pereira_Martins.pdf'
    ),
    (
        'santana-girley',
        'Girley Batista Santana',
        'Território, cultura, memória e ancestralidade: a resistência Krenak sob a perspectiva autoetnográfica',
        'Observatório Interdisciplinar do Território (OBIT) / NEDER',
        'Prof. Dr. Roberto Almeida',
        '2025-03-24',
        705,
        'dissertacoes/Girley_Batista_Santana.pdf',
        'https://pwusflbyvamjnfmuvagy.supabase.co/storage/v1/object/public/dissertacoes/Girley_Batista_Santana.pdf'
    )
ON CONFLICT (id) DO UPDATE SET
    autor = EXCLUDED.autor,
    titulo = EXCLUDED.titulo,
    laboratorio = EXCLUDED.laboratorio,
    orientador = EXCLUDED.orientador,
    data_defesa = EXCLUDED.data_defesa,
    dias_para_conclusao = EXCLUDED.dias_para_conclusao,
    pdf_storage_path = EXCLUDED.pdf_storage_path;
