-- ============================================================
-- U-Ride UTA - Script 14: Columna evidencia_link en reportes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- PASO 1: Crear columna evidencia_link si no existe
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS evidencia_link TEXT;

-- PASO 2: Ver todos los reportes actuales con sus evidencias
-- Corre esto primero para ver qué reportes tienen imagen pero no link
SELECT
    id,
    LEFT(evidencia_url,  80) AS evidencia_url,
    LEFT(evidencia_link, 80) AS evidencia_link,
    created_at
FROM reportes
ORDER BY created_at DESC
LIMIT 20;

-- ============================================================
-- PASO 3 (OPCIONAL): Si un reporte tiene imagen pero el link
-- se perdió, actualízalo manualmente con el link real.
-- Reemplaza 'EL-ID-DEL-REPORTE' con el ID real del reporte
-- y 'https://tu-link-aqui.com' con el link que el usuario envió.
-- ============================================================
-- UPDATE reportes
-- SET evidencia_link = 'https://tu-link-aqui.com'
-- WHERE id = 'EL-ID-DEL-REPORTE';
