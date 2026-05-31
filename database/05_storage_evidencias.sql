-- ============================================================
-- U-Ride UTA - Script 05: Storage para evidencias de reportes
-- Ejecutar en Supabase SQL Editor si se quiere subir archivos
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias-reportes', 'evidencias-reportes', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS evidencias_reportes_select ON storage.objects;
DROP POLICY IF EXISTS evidencias_reportes_insert ON storage.objects;

CREATE POLICY evidencias_reportes_select ON storage.objects
    FOR SELECT USING (bucket_id = 'evidencias-reportes');

CREATE POLICY evidencias_reportes_insert ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'evidencias-reportes');
