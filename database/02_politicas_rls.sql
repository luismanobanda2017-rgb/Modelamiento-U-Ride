-- ============================================================
-- U-Ride UTA - Script 02: Politicas de Seguridad (RLS)
-- Ejecutar despues de 01_tablas.sql
-- ============================================================

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE viajes ENABLE ROW LEVEL SECURITY;
ALTER TABLE solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reportes ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_log ENABLE ROW LEVEL SECURITY;

-- Limpiar politicas anteriores si existen
DROP POLICY IF EXISTS usuarios_select ON usuarios;
DROP POLICY IF EXISTS usuarios_insert ON usuarios;
DROP POLICY IF EXISTS usuarios_update ON usuarios;
DROP POLICY IF EXISTS viajes_select ON viajes;
DROP POLICY IF EXISTS viajes_insert ON viajes;
DROP POLICY IF EXISTS viajes_update ON viajes;
DROP POLICY IF EXISTS solicitudes_all ON solicitudes;
DROP POLICY IF EXISTS calificaciones_all ON calificaciones;
DROP POLICY IF EXISTS reportes_all ON reportes;
DROP POLICY IF EXISTS eventos_all ON eventos_log;

-- Usuarios: lectura publica (para login/registro desde frontend vanilla)
CREATE POLICY usuarios_select ON usuarios
    FOR SELECT USING (true);

CREATE POLICY usuarios_insert ON usuarios
    FOR INSERT WITH CHECK (true);

CREATE POLICY usuarios_update ON usuarios
    FOR UPDATE USING (true) WITH CHECK (true);

-- Viajes: lectura publica, escritura libre (RLS simple para frontend)
CREATE POLICY viajes_select ON viajes
    FOR SELECT USING (true);

CREATE POLICY viajes_insert ON viajes
    FOR INSERT WITH CHECK (true);

CREATE POLICY viajes_update ON viajes
    FOR UPDATE USING (true) WITH CHECK (true);

-- Solicitudes
CREATE POLICY solicitudes_all ON solicitudes
    FOR ALL USING (true) WITH CHECK (true);

-- Calificaciones
CREATE POLICY calificaciones_all ON calificaciones
    FOR ALL USING (true) WITH CHECK (true);

-- Reportes
CREATE POLICY reportes_all ON reportes
    FOR ALL USING (true) WITH CHECK (true);

-- Log de eventos
CREATE POLICY eventos_all ON eventos_log
    FOR ALL USING (true) WITH CHECK (true);
