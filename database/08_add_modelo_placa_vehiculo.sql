-- ============================================================
-- U-Ride UTA - Script 08: Asegurar columnas de vehículo en usuarios
-- Ejecutar en Supabase SQL Editor
-- ============================================================

ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS placa_vehiculo TEXT,
ADD COLUMN IF NOT EXISTS modelo_vehiculo TEXT;

-- Asegurar columna modo_actual (agregar si falta) y constraint de valores
ALTER TABLE usuarios
ADD COLUMN IF NOT EXISTS modo_actual TEXT NOT NULL DEFAULT 'pasajero';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'usuarios_modo_actual_check'
    ) THEN
        ALTER TABLE usuarios
        ADD CONSTRAINT usuarios_modo_actual_check
        CHECK (modo_actual IN ('pasajero', 'conductor'));
    END IF;
END $$;

-- Mantener consistencia del modo_actual en caso de que existan placas previas
UPDATE usuarios
SET modo_actual = 'conductor'
WHERE placa_vehiculo IS NOT NULL
  AND btrim(placa_vehiculo) <> '';
