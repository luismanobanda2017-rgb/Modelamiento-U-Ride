-- ============================================================
-- U-Ride UTA - Script 11: Verificar estado de viajes
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Ver TODOS los viajes sin filtro (incluyendo estado)
SELECT 
    v.id,
    v.conductor_id,
    u.nombre as conductor_nombre,
    v.origen,
    v.destino,
    v.fecha,
    v.hora_salida,
    v.cupos_total,
    v.cupos_disponibles,
    v.precio_persona,
    v.estado,
    v.created_at
FROM viajes v
LEFT JOIN usuarios u ON v.conductor_id = u.id
ORDER BY v.created_at DESC;

-- 2. Contar viajes por estado
SELECT estado, COUNT(*) as cantidad
FROM viajes
GROUP BY estado
ORDER BY estado;

-- 3. Ver viajes que DEBERÍAN aparecer (disponibles con cupos)
SELECT 
    v.id,
    u.nombre as conductor,
    v.origen,
    v.destino,
    v.estado,
    v.cupos_disponibles,
    v.cupos_total
FROM viajes v
LEFT JOIN usuarios u ON v.conductor_id = u.id
WHERE v.estado = 'disponible' AND v.cupos_disponibles > 0
ORDER BY v.fecha ASC, v.hora_salida ASC;

-- 4. Ver viajes que NO aparecen (y por qué)
SELECT 
    v.id,
    u.nombre as conductor,
    v.origen,
    v.destino,
    v.estado,
    v.cupos_disponibles,
    CASE 
        WHEN v.estado != 'disponible' THEN 'Estado no es disponible'
        WHEN v.cupos_disponibles <= 0 THEN 'Sin cupos disponibles'
        ELSE 'Debería aparecer'
    END as razon
FROM viajes v
LEFT JOIN usuarios u ON v.conductor_id = u.id
WHERE v.estado != 'disponible' OR v.cupos_disponibles <= 0
ORDER BY v.created_at DESC;

-- 5. Verificar que las políticas RLS permiten SELECT
SELECT schemaname, tablename, policyname, permissive, roles, qual
FROM pg_policies
WHERE tablename = 'viajes' AND policyname LIKE '%select%'
ORDER BY policyname;

-- 6. Verificar permisos de anon en viajes
SELECT grantee, privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'viajes'
ORDER BY grantee, privilege_type;
