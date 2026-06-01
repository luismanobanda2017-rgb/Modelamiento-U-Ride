-- ============================================================
-- U-Ride UTA - Script 10: Diagnóstico de datos para María González
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Buscar a María González en usuarios
SELECT id, nombre, email, rol, modo_actual, placa_vehiculo, modelo_vehiculo, estado, verificado
FROM usuarios
WHERE nombre ILIKE '%maria%' OR email ILIKE '%maria%'
ORDER BY created_at DESC;

-- 2. Ver todos los viajes publicados (sin filtro)
SELECT id, conductor_id, origen, destino, fecha, hora_salida, cupos_total, cupos_disponibles, estado, created_at
FROM viajes
ORDER BY created_at DESC
LIMIT 20;

-- 3. Ver viajes de María González específicamente (si es conductora)
SELECT v.id, v.conductor_id, v.origen, v.destino, v.fecha, v.hora_salida, v.cupos_total, v.cupos_disponibles, v.estado, v.created_at
FROM viajes v
WHERE v.conductor_id IN (
    SELECT id FROM usuarios WHERE nombre ILIKE '%maria%'
)
ORDER BY v.created_at DESC;

-- 4. Ver solicitudes de María González (si es pasajera)
SELECT s.id, s.viaje_id, s.pasajero_id, s.estado, s.asientos, s.created_at
FROM solicitudes s
WHERE s.pasajero_id IN (
    SELECT id FROM usuarios WHERE nombre ILIKE '%maria%'
)
ORDER BY s.created_at DESC;

-- 5. Verificar políticas RLS en viajes
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'viajes'
ORDER BY policyname;

-- 6. Verificar políticas RLS en usuarios
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'usuarios'
ORDER BY policyname;

-- 7. Verificar permisos de rol anon
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'viajes' AND grantee = 'anon'
ORDER BY privilege_type;

-- 8. Contar registros totales
SELECT 
    (SELECT COUNT(*) FROM usuarios) as total_usuarios,
    (SELECT COUNT(*) FROM viajes) as total_viajes,
    (SELECT COUNT(*) FROM solicitudes) as total_solicitudes,
    (SELECT COUNT(*) FROM calificaciones) as total_calificaciones;
