-- ============================================================
-- U-Ride UTA - Script 09: Fix RLS y permisos para anon key
-- Ejecutar en Supabase SQL Editor
-- Proyecto: qwszgjivoknjhhswiatz
-- ============================================================

-- Asegurar que RLS está habilitado en todas las tablas
ALTER TABLE usuarios     ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_log  ENABLE ROW LEVEL SECURITY;

-- ── Limpiar políticas anteriores ──────────────────────────────
DROP POLICY IF EXISTS usuarios_select   ON usuarios;
DROP POLICY IF EXISTS usuarios_insert   ON usuarios;
DROP POLICY IF EXISTS usuarios_update   ON usuarios;
DROP POLICY IF EXISTS usuarios_delete   ON usuarios;

DROP POLICY IF EXISTS viajes_select     ON viajes;
DROP POLICY IF EXISTS viajes_insert     ON viajes;
DROP POLICY IF EXISTS viajes_update     ON viajes;
DROP POLICY IF EXISTS viajes_delete     ON viajes;

DROP POLICY IF EXISTS solicitudes_all   ON solicitudes;
DROP POLICY IF EXISTS calificaciones_all ON calificaciones;
DROP POLICY IF EXISTS reportes_all      ON reportes;
DROP POLICY IF EXISTS eventos_all       ON eventos_log;

-- ── Políticas para usuarios ───────────────────────────────────
-- Lectura pública (necesario para login, buscar conductores, etc.)
CREATE POLICY usuarios_select ON usuarios
    FOR SELECT TO anon, authenticated USING (true);

-- Inserción pública (registro de nuevos usuarios)
CREATE POLICY usuarios_insert ON usuarios
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Actualización pública (editar perfil, cambiar modo, etc.)
CREATE POLICY usuarios_update ON usuarios
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Eliminación (solo para admin, pero permitimos para simplificar)
CREATE POLICY usuarios_delete ON usuarios
    FOR DELETE TO anon, authenticated USING (true);

-- ── Políticas para viajes ─────────────────────────────────────
-- Lectura pública (buscar viajes disponibles)
CREATE POLICY viajes_select ON viajes
    FOR SELECT TO anon, authenticated USING (true);

-- Inserción (publicar viaje)
CREATE POLICY viajes_insert ON viajes
    FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Actualización (cancelar, finalizar viaje)
CREATE POLICY viajes_update ON viajes
    FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Eliminación
CREATE POLICY viajes_delete ON viajes
    FOR DELETE TO anon, authenticated USING (true);

-- ── Políticas para solicitudes ────────────────────────────────
CREATE POLICY solicitudes_all ON solicitudes
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Políticas para calificaciones ────────────────────────────
CREATE POLICY calificaciones_all ON calificaciones
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Políticas para reportes ───────────────────────────────────
CREATE POLICY reportes_all ON reportes
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Políticas para eventos_log ────────────────────────────────
CREATE POLICY eventos_all ON eventos_log
    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- ── Grants explícitos al rol anon ────────────────────────────
-- Necesario para que la anon key pueda leer/escribir
GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios      TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON viajes        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON solicitudes   TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON calificaciones TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON reportes      TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON eventos_log   TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON usuarios      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON viajes        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON solicitudes   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON calificaciones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON reportes      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON eventos_log   TO authenticated;

-- ── Verificación: contar registros en tablas principales ──────
SELECT 'usuarios'    AS tabla, COUNT(*) AS total FROM usuarios
UNION ALL
SELECT 'viajes'      AS tabla, COUNT(*) AS total FROM viajes
UNION ALL
SELECT 'solicitudes' AS tabla, COUNT(*) AS total FROM solicitudes;
