-- ============================================================
-- U-Ride UTA - Script 14: Columna evidencia_link en reportes
-- ⚠️ EJECUTAR ESTO EN SUPABASE SQL EDITOR PARA QUE FUNCIONE
-- ============================================================

-- Agrega la columna evidencia_link a la tabla reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS evidencia_link TEXT;

-- Verifica que se creó correctamente
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'reportes' AND column_name = 'evidencia_link';
