-- ============================================================
-- U-Ride UTA - Script 14: Columna evidencia_link en reportes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Agregar columna separada para el link de evidencia
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS evidencia_link TEXT;

-- 2. Migrar reportes existentes:
--    Si evidencia_url NO es una URL de Supabase Storage (es un link externo),
--    moverla a evidencia_link y limpiar evidencia_url
UPDATE reportes
SET
    evidencia_link = evidencia_url,
    evidencia_url  = NULL
WHERE
    evidencia_url IS NOT NULL
    AND evidencia_url NOT LIKE '%supabase.co/storage%';

-- 3. Verificar resultado
SELECT
    id,
    LEFT(evidencia_url,  60) AS evidencia_url,
    LEFT(evidencia_link, 60) AS evidencia_link
FROM reportes
WHERE evidencia_url IS NOT NULL OR evidencia_link IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- 4. Verificar estructura final de reportes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reportes'
ORDER BY ordinal_position;
