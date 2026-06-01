-- ============================================================
-- U-Ride UTA - Script 14: Columna evidencia_link en reportes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- Agregar columna separada para el link de evidencia
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS evidencia_link TEXT;

-- Verificar estructura final de reportes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reportes'
ORDER BY ordinal_position;
