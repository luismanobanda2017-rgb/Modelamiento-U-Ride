-- ============================================================
-- U-Ride UTA - Script 08: Asegurar columnas de vehículo en usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS placa_vehiculo TEXT,
ADD COLUMN IF NOT EXISTS modelo_vehiculo TEXT;

-- Mantener consistencia del modo_actual en caso de que existan placas previas
UPDATE usuarios
SET modo_actual = 'conductor'
WHERE placa_vehiculo IS NOT NULL
  AND btrim(placa_vehiculo) <> '';
