-- ============================================================
-- U-Ride UTA - Script 12: Corregir datos de María González
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Verificar que María existe
SELECT id, nombre, email, rol, modo_actual, placa_vehiculo, estado, verificado
FROM usuarios
WHERE nombre ILIKE '%maria%'
LIMIT 5;

-- 2. Asegurar que María está verificada y activa
UPDATE usuarios
SET verificado = true, estado = 'activo'
WHERE nombre ILIKE '%maria%';

-- 3. Si María es conductora, asegurar que tiene modo_actual = 'conductor'
UPDATE usuarios
SET modo_actual = 'conductor'
WHERE nombre ILIKE '%maria%' AND placa_vehiculo IS NOT NULL AND btrim(placa_vehiculo) <> '';

-- 4. Si María es pasajera, asegurar que tiene modo_actual = 'pasajero'
UPDATE usuarios
SET modo_actual = 'pasajero'
WHERE nombre ILIKE '%maria%' AND (placa_vehiculo IS NULL OR btrim(placa_vehiculo) = '');

-- 5. Corregir estado de viajes de María (si es conductora)
UPDATE viajes
SET estado = 'disponible', cupos_disponibles = cupos_total
WHERE conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%')
AND estado IN ('cancelado', 'completo');

-- 6. Asegurar que los viajes de María tienen cupos disponibles
UPDATE viajes
SET cupos_disponibles = cupos_total
WHERE conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%')
AND cupos_disponibles = 0;

-- 7. Verificar resultado
SELECT 
    u.id,
    u.nombre,
    u.modo_actual,
    u.placa_vehiculo,
    u.estado,
    u.verificado,
    COUNT(v.id) as total_viajes,
    SUM(CASE WHEN v.estado = 'disponible' THEN 1 ELSE 0 END) as viajes_disponibles
FROM usuarios u
LEFT JOIN viajes v ON u.id = v.conductor_id
WHERE u.nombre ILIKE '%maria%'
GROUP BY u.id, u.nombre, u.modo_actual, u.placa_vehiculo, u.estado, u.verificado;

-- 8. Ver viajes de María con detalles
SELECT 
    v.id,
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
WHERE v.conductor_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%')
ORDER BY v.fecha DESC, v.hora_salida DESC;

-- 9. Ver solicitudes de María (si es pasajera)
SELECT 
    s.id,
    s.viaje_id,
    s.estado,
    s.asientos,
    v.origen,
    v.destino,
    v.fecha,
    s.created_at
FROM solicitudes s
LEFT JOIN viajes v ON s.viaje_id = v.id
WHERE s.pasajero_id IN (SELECT id FROM usuarios WHERE nombre ILIKE '%maria%')
ORDER BY s.created_at DESC;
