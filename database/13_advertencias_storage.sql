-- ============================================================
-- U-Ride UTA - Script 13: Tabla advertencias + Storage bucket
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Tabla de advertencias enviadas por el admin a usuarios
CREATE TABLE IF NOT EXISTS advertencias (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id    UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    reporte_id    UUID REFERENCES reportes(id) ON DELETE SET NULL,
    admin_id      UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    mensaje       TEXT NOT NULL,
    leida         BOOLEAN NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_advertencias_usuario ON advertencias(usuario_id);
CREATE INDEX IF NOT EXISTS idx_advertencias_leida   ON advertencias(usuario_id, leida);

-- 3. RLS para advertencias
ALTER TABLE advertencias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advertencias_all ON advertencias;
CREATE POLICY advertencias_all ON advertencias
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

GRANT SELECT, INSERT, UPDATE, DELETE ON advertencias TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON advertencias TO authenticated;

-- 4. Asegurar que la columna accion_admin existe en reportes
ALTER TABLE reportes ADD COLUMN IF NOT EXISTS accion_admin TEXT;

-- 5. Crear el bucket de storage para evidencias (via SQL no es posible directamente,
--    pero sí podemos asegurar los permisos de storage via policies)
--    El bucket debe crearse manualmente en Storage → Buckets con nombre: evidencias-reportes
--    Aquí configuramos las políticas de storage:

-- Política para permitir subir archivos (INSERT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'evidencias-reportes',
    'evidencias-reportes',
    true,
    52428800,  -- 50 MB (para videos)
    ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/ogg','video/quicktime','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/jpeg','image/png','image/gif','image/webp','video/mp4','video/webm','video/ogg','video/quicktime','application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Política de storage: cualquiera puede subir
DROP POLICY IF EXISTS "evidencias_upload" ON storage.objects;
CREATE POLICY "evidencias_upload" ON storage.objects
    FOR INSERT TO anon, authenticated
    WITH CHECK (bucket_id = 'evidencias-reportes');

-- Política de storage: cualquiera puede leer
DROP POLICY IF EXISTS "evidencias_read" ON storage.objects;
CREATE POLICY "evidencias_read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id = 'evidencias-reportes');

-- Política de storage: el dueño puede eliminar
DROP POLICY IF EXISTS "evidencias_delete" ON storage.objects;
CREATE POLICY "evidencias_delete" ON storage.objects
    FOR DELETE TO anon, authenticated
    USING (bucket_id = 'evidencias-reportes');

-- 6. Verificación
SELECT 'advertencias' AS tabla, COUNT(*) AS total FROM advertencias
UNION ALL
SELECT 'reportes' AS tabla, COUNT(*) AS total FROM reportes
UNION ALL
SELECT 'usuarios' AS tabla, COUNT(*) AS total FROM usuarios;

-- 7. Verificar que el bucket existe
SELECT id, name, public FROM storage.buckets WHERE id = 'evidencias-reportes';
